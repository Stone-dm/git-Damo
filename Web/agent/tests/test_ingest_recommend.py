"""Tests for /ingest, /recommend, /chat (mocked Milvus + DeepSeek)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app
from app.stores.milvus_store import COLLECTION_LEARNING, COLLECTION_PERSONAL


@pytest.fixture
def settings_no_llm():
    return Settings(
        deepseek_api_key="",
        embedding_api_key="",
        embedding_dim=8,
    )


@pytest.fixture
def mock_store():
    store = MagicMock()
    store.ensure_collections = MagicMock()
    store.upsert = MagicMock()
    store.search = MagicMock(return_value=[])
    return store


@pytest.fixture
def client(mock_store, settings_no_llm):
    get_settings.cache_clear()
    with (
        patch("app.main.get_settings", return_value=settings_no_llm),
        patch("app.main.MilvusStore", return_value=mock_store),
        patch("app.config.get_settings", return_value=settings_no_llm),
        patch("app.api.ingest.get_settings", return_value=settings_no_llm),
        patch("app.recommend.chain.get_settings", return_value=settings_no_llm),
        patch("app.assistant.chain.get_settings", return_value=settings_no_llm),
        patch("app.rag.embeddings.get_settings", return_value=settings_no_llm),
        patch("app.llm.deepseek.get_settings", return_value=settings_no_llm),
    ):
        with TestClient(app) as c:
            c.app.state.milvus = mock_store
            yield c, mock_store
    get_settings.cache_clear()


def test_ingest_chunks_and_upserts(client):
    c, store = client
    payload = {
        "document_id": "1",
        "kb_type": "LEARNING",
        "text": "党的二十大报告学习要点。" * 20,
        "user_id": "1",
        "branch_id": "1",
    }
    resp = c.post("/ingest", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["chunks"] >= 1
    store.upsert.assert_called_once()
    args, _kwargs = store.upsert.call_args
    assert args[0] == COLLECTION_LEARNING
    rows = args[1]
    assert rows[0]["document_id"] == "1"
    assert rows[0]["branch_id"] == "1"
    assert "embedding" in rows[0]
    assert len(rows[0]["embedding"]) == 8


def test_ingest_personal_collection(client):
    c, store = client
    resp = c.post(
        "/ingest",
        json={
            "document_id": "2",
            "kb_type": "PERSONAL",
            "text": "个人学习笔记内容",
            "user_id": "3",
            "branch_id": "1",
        },
    )
    assert resp.status_code == 200
    args, _ = store.upsert.call_args
    assert args[0] == COLLECTION_PERSONAL
    assert args[1][0]["user_id"] == "3"


def test_recommend_degrades_without_key_or_hits(client):
    c, store = client
    store.search.return_value = []
    resp = c.post(
        "/recommend",
        json={"user_id": "3", "branch_id": "1", "query": "近期适合学什么"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert len(body["items"]) >= 1
    assert "title" in body["items"][0]
    assert "reason" in body["items"][0]


def test_recommend_uses_retrieval_with_llm(client):
    c, store = client
    store.search.side_effect = [
        [{"text": "个人笔记：学党史", "document_id": "10", "score": 0.9}],
        [{"text": "二十大报告要点", "document_id": "1", "score": 0.8}],
    ]
    fake_items = [
        {"title": "学党史", "reason": "结合个人笔记", "document_id": "10"},
        {"title": "二十大报告", "reason": "支部资料", "document_id": "1"},
    ]

    llm = MagicMock()
    llm.available = True
    llm.complete_json.return_value = {"items": fake_items}

    with patch("app.recommend.chain.DeepSeekClient", return_value=llm):
        resp = c.post(
            "/recommend",
            json={"user_id": "3", "branch_id": "1", "query": "推荐学习"},
        )

    assert resp.status_code == 200
    assert resp.json()["items"] == fake_items
    assert store.search.call_count == 2


def test_chat_with_text_degrades_without_key(client):
    c, _store = client
    resp = c.post(
        "/chat",
        json={
            "user_id": "3",
            "branch_id": "1",
            "role": "MEMBER",
            "message": "帮我总结要点",
            "text": "测试文档内容：坚持党的领导，推进高质量发展。",
            "history": [],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "reply" in body
    assert isinstance(body["reply"], str)
    assert len(body["reply"]) > 0


def test_chat_rag_degrades_on_empty_retrieval(client):
    c, store = client
    store.search.return_value = []
    resp = c.post(
        "/chat",
        json={
            "user_id": "3",
            "branch_id": "1",
            "role": "MEMBER",
            "message": "什么是二十大精神？",
            "document_id": None,
            "text": None,
            "history": [],
        },
    )
    assert resp.status_code == 200
    assert "reply" in resp.json()


def test_recommend_accepts_backend_null_branch_and_blank_query(client):
    """Backend may send null branch_id / blank query when member has no branch or omits query."""
    c, store = client
    store.search.return_value = []
    resp = c.post(
        "/recommend",
        json={"user_id": "3", "branch_id": None, "query": ""},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "items" in body
    assert len(body["items"]) >= 1


def test_ingest_accepts_backend_null_ids(client):
    c, store = client
    resp = c.post(
        "/ingest",
        json={
            "document_id": "9",
            "kb_type": "LEARNING",
            "text": "联调对齐字段：支部学习材料正文。",
            "user_id": "1",
            "branch_id": None,
        },
    )
    assert resp.status_code == 200, resp.text
    args, _ = store.upsert.call_args
    assert args[0] == COLLECTION_LEARNING
    assert args[1][0]["branch_id"] == ""


def test_chat_accepts_backend_null_branch(client):
    c, _store = client
    resp = c.post(
        "/chat",
        json={
            "user_id": "3",
            "branch_id": None,
            "role": "MEMBER",
            "message": "帮我总结要点",
            "text": "测试文档内容",
            "history": [],
        },
    )
    assert resp.status_code == 200, resp.text
    assert len(resp.json()["reply"]) > 0


def test_recommend_learning_filter_includes_global_branch(client):
    c, store = client
    store.search.return_value = []
    resp = c.post(
        "/recommend",
        json={"user_id": "3", "branch_id": "1", "query": "推荐学习"},
    )
    assert resp.status_code == 200
    assert store.search.call_count == 2
    learning_call = store.search.call_args_list[1]
    assert learning_call.args[0] == COLLECTION_LEARNING
    filter_expr = learning_call.args[2]
    assert 'branch_id == "1"' in filter_expr
    assert 'branch_id == ""' in filter_expr


def test_chat_document_admin_empty_branch_skips_branch_filter(client):
    c, store = client
    store.search.return_value = []
    resp = c.post(
        "/chat",
        json={
            "user_id": "1",
            "branch_id": "",
            "role": "ADMIN",
            "message": "总结这份材料",
            "document_id": "99",
            "text": None,
            "history": [],
        },
    )
    assert resp.status_code == 200
    learning_calls = [
        call for call in store.search.call_args_list if call.args[0] == COLLECTION_LEARNING
    ]
    assert learning_calls
    assert learning_calls[0].args[2] == 'document_id == "99"'


def test_agent_token_required_when_configured(mock_store):
    settings = Settings(
        deepseek_api_key="",
        embedding_api_key="",
        embedding_dim=8,
        agent_shared_token="secret-token",
    )
    get_settings.cache_clear()
    with (
        patch("app.main.get_settings", return_value=settings),
        patch("app.main.MilvusStore", return_value=mock_store),
        patch("app.config.get_settings", return_value=settings),
        patch("app.security.get_settings", return_value=settings),
        patch("app.api.ingest.get_settings", return_value=settings),
        patch("app.recommend.chain.get_settings", return_value=settings),
        patch("app.assistant.chain.get_settings", return_value=settings),
        patch("app.rag.embeddings.get_settings", return_value=settings),
        patch("app.llm.deepseek.get_settings", return_value=settings),
    ):
        with TestClient(app) as c:
            c.app.state.milvus = mock_store
            denied = c.post(
                "/recommend",
                json={"user_id": "3", "branch_id": "1", "query": "推荐"},
            )
            assert denied.status_code == 401
            ok = c.post(
                "/recommend",
                headers={"X-Agent-Token": "secret-token"},
                json={"user_id": "3", "branch_id": "1", "query": "推荐"},
            )
            assert ok.status_code == 200
            health = c.get("/health")
            assert health.status_code == 200
    get_settings.cache_clear()
