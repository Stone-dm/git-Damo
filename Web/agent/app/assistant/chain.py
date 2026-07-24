"""Personal AI assistant chain: summarize context or dual-KB Q&A."""

from __future__ import annotations

import logging
from typing import Any

from app.config import Settings, get_settings
from app.llm.deepseek import DeepSeekClient
from app.rag.embeddings import EmbeddingClient
from app.recommend.chain import retrieve_context, _safe_search
from app.stores.milvus_store import (
    COLLECTION_LEARNING,
    COLLECTION_PERSONAL,
    MilvusStore,
)

logger = logging.getLogger(__name__)


def _fetch_document_chunks(
    store: MilvusStore,
    embedder: EmbeddingClient,
    document_id: str,
    *,
    user_id: str,
    branch_id: str,
) -> list[dict[str, Any]]:
    """Retrieve chunks for a document from both collections (permission-scoped)."""
    # Use document_id as query text so pseudo/real embeddings still return neighbors;
    # primary filter is document_id equality.
    vector = embedder.embed_one(document_id)
    personal = _safe_search(
        store,
        COLLECTION_PERSONAL,
        vector,
        f'user_id == "{user_id}" and document_id == "{document_id}"',
        top_k=8,
    )
    learning = _safe_search(
        store,
        COLLECTION_LEARNING,
        vector,
        f'branch_id == "{branch_id}" and document_id == "{document_id}"',
        top_k=8,
    )
    return [*personal, *learning]


def _degraded_reply(*, message: str, context: str | None) -> str:
    if context:
        preview = context.strip().replace("\n", " ")
        if len(preview) > 200:
            preview = preview[:200] + "…"
        return (
            f"（离线降级）已收到您的请求「{message}」。"
            f"当前未配置大模型密钥，暂根据材料摘录：{preview}"
        )
    return (
        f"（离线降级）已收到您的问题「{message}」。"
        "当前知识库暂无相关内容或未配置大模型，请稍后重试或补充材料后提问。"
    )


def chat(
    store: MilvusStore,
    *,
    user_id: str,
    branch_id: str,
    role: str,
    message: str,
    document_id: str | None = None,
    text: str | None = None,
    history: list[dict[str, str]] | None = None,
    settings: Settings | None = None,
    llm: DeepSeekClient | None = None,
    embedder: EmbeddingClient | None = None,
) -> dict[str, str]:
    settings = settings or get_settings()
    embedder = embedder or EmbeddingClient(settings)
    llm = llm or DeepSeekClient(settings)
    history = history or []

    context_text: str | None = None
    mode = "qa"

    if text and text.strip():
        context_text = text.strip()
        mode = "summarize"
    elif document_id:
        hits = _fetch_document_chunks(
            store, embedder, document_id, user_id=user_id, branch_id=branch_id
        )
        if hits:
            context_text = "\n\n".join(str(h.get("text") or "") for h in hits)
            mode = "summarize"
        else:
            mode = "qa"

    if mode == "qa" and context_text is None:
        hits = retrieve_context(
            store, embedder, user_id=user_id, branch_id=branch_id, query=message
        )
        if hits:
            context_text = "\n\n".join(
                f"[doc={h.get('document_id')}] {h.get('text')}" for h in hits
            )

    if not llm.available:
        return {"reply": _degraded_reply(message=message, context=context_text)}

    if mode == "summarize" and context_text:
        system = (
            f"你是党校个人学习助手（用户角色：{role}）。"
            "根据给定材料，按用户要求进行总结、整理或提炼要点，回答简洁准确。"
        )
        user_content = f"用户请求：{message}\n\n材料内容：\n{context_text}"
    elif context_text:
        system = (
            f"你是党校个人学习助手（用户角色：{role}）。"
            "依据检索到的个人与支部学习材料回答问题；若材料不足请明确说明。"
        )
        user_content = f"用户问题：{message}\n\n检索材料：\n{context_text}"
    else:
        return {"reply": _degraded_reply(message=message, context=None)}

    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for turn in history[-10:]:
        role_name = turn.get("role") or "user"
        content = turn.get("content") or ""
        if role_name in ("user", "assistant", "system") and content:
            messages.append({"role": role_name, "content": content})
    messages.append({"role": "user", "content": user_content})

    try:
        reply = llm.complete(messages)
        if not reply:
            return {"reply": _degraded_reply(message=message, context=context_text)}
        return {"reply": reply}
    except Exception as exc:
        logger.warning("Chat LLM failed, degrading: %s", exc)
        return {"reply": _degraded_reply(message=message, context=context_text)}
