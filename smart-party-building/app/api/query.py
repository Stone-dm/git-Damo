"""
查询 API 路由
"""
from __future__ import annotations

from fastapi import APIRouter

from app.agents.query_agent import QueryAgent
from app.models.schemas import ChatRequest, ChatResponse, QueryRequest, QueryResponse

router = APIRouter(prefix="/api/v1", tags=["智能查询"])

query_agent = QueryAgent()


@router.post("/query", response_model=QueryResponse, summary="自然语言查询")
async def query(request: QueryRequest):
    """
    使用自然语言查询党建知识、政策文件、组织信息等。

    - **query**: 用户查询内容
    - **member_id**: 党员ID（可选，用于个性化上下文）
    - **conversation_id**: 会话ID（可选，用于多轮对话）
    - **history**: 对话历史（可选）
    """
    result = await query_agent.query(
        question=request.query,
        member_id=request.member_id,
        history=request.history,
    )

    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"],
        conversation_id=request.conversation_id,
        processing_time=result["processing_time"],
    )


@router.post("/chat", response_model=ChatResponse, summary="多轮对话")
async def chat(request: ChatRequest):
    """
    与智能体进行多轮对话。

    - **message**: 用户消息
    - **member_id**: 党员ID（可选）
    - **conversation_id**: 会话ID（可选）
    """
    result = await query_agent.query(
        question=request.message,
        member_id=request.member_id,
    )

    return ChatResponse(
        reply=result["answer"],
        conversation_id=request.conversation_id or f"conv_{id(request)}",
        sources=result["sources"],
        suggestions=[],
    )
