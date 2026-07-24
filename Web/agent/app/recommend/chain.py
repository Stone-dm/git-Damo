"""Personalized recommend chain: dual-KB retrieval + DeepSeek (with degradation)."""

from __future__ import annotations

import logging
from typing import Any

from app.config import Settings, get_settings
from app.llm.deepseek import DeepSeekClient
from app.rag.embeddings import EmbeddingClient
from app.rag.filters import learning_filter_expr
from app.stores.milvus_store import (
    COLLECTION_LEARNING,
    COLLECTION_PERSONAL,
    MilvusStore,
)

logger = logging.getLogger(__name__)

GENERIC_ITEMS: list[dict[str, Any]] = [
    {
        "title": "坚持系统学习党的创新理论",
        "reason": "当前知识库暂无匹配内容，建议从支部学习资料中选择近期重点文件研读。",
        "document_id": None,
    },
    {
        "title": "结合岗位实践撰写学习笔记",
        "reason": "通过个人知识库沉淀体会，便于后续个性化推荐。",
        "document_id": None,
    },
]


def _safe_search(
    store: MilvusStore,
    collection: str,
    vector: list[float],
    filter_expr: str,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    try:
        return store.search(collection, vector, filter_expr, top_k=top_k)
    except Exception as exc:
        logger.warning("Milvus search failed (%s): %s", collection, exc)
        return []


def retrieve_context(
    store: MilvusStore,
    embedder: EmbeddingClient,
    *,
    user_id: str,
    branch_id: str,
    query: str,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    vector = embedder.embed_one(query)
    personal = _safe_search(
        store,
        COLLECTION_PERSONAL,
        vector,
        f'user_id == "{user_id}"',
        top_k=top_k,
    )
    learning = _safe_search(
        store,
        COLLECTION_LEARNING,
        vector,
        learning_filter_expr(branch_id),
        top_k=top_k,
    )
    return [*personal, *learning]


def recommend(
    store: MilvusStore,
    *,
    user_id: str,
    branch_id: str,
    query: str,
    settings: Settings | None = None,
    llm: DeepSeekClient | None = None,
    embedder: EmbeddingClient | None = None,
) -> dict[str, Any]:
    settings = settings or get_settings()
    embedder = embedder or EmbeddingClient(settings)
    llm = llm or DeepSeekClient(settings)

    hits = retrieve_context(
        store, embedder, user_id=user_id, branch_id=branch_id, query=query
    )

    if not hits or not llm.available:
        logger.info(
            "Recommend degrade (hits=%s, llm=%s)",
            len(hits),
            llm.available,
        )
        return {"items": list(GENERIC_ITEMS)}

    context_lines = []
    for i, hit in enumerate(hits, 1):
        context_lines.append(
            f"[{i}] document_id={hit.get('document_id')} score={hit.get('score')}\n"
            f"{hit.get('text', '')}"
        )
    context = "\n\n".join(context_lines)

    messages = [
        {
            "role": "system",
            "content": (
                "你是党校学习推荐助手。根据检索到的个人与支部学习材料，"
                "为用户生成个性化学习推荐。必须只输出 JSON 对象，格式为："
                '{"items":[{"title":"...","reason":"...","document_id":"..."|null}]}。'
                "items 至少 1 条、最多 5 条；document_id 尽量来自检索结果。"
            ),
        },
        {
            "role": "user",
            "content": f"用户问题：{query}\n\n检索材料：\n{context}",
        },
    ]

    try:
        data = llm.complete_json(messages)
        items = data.get("items")
        if not isinstance(items, list) or not items:
            return {"items": list(GENERIC_ITEMS)}
        normalized: list[dict[str, Any]] = []
        for item in items[:5]:
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "title": str(item.get("title") or "学习建议"),
                    "reason": str(item.get("reason") or ""),
                    "document_id": item.get("document_id"),
                }
            )
        if not normalized:
            return {"items": list(GENERIC_ITEMS)}
        return {"items": normalized}
    except Exception as exc:
        logger.warning("Recommend LLM failed, degrading: %s", exc)
        return {"items": list(GENERIC_ITEMS)}
