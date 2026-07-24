"""POST /recommend — dual-KB retrieval + DeepSeek recommend."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.recommend.chain import recommend as run_recommend

router = APIRouter()


class RecommendRequest(BaseModel):
    user_id: str
    branch_id: str
    query: str = Field(..., min_length=1)


class RecommendItem(BaseModel):
    title: str
    reason: str
    document_id: str | None = None


class RecommendResponse(BaseModel):
    items: list[RecommendItem]


@router.post("/recommend", response_model=RecommendResponse)
def recommend(body: RecommendRequest, request: Request) -> dict[str, Any]:
    store = request.app.state.milvus
    return run_recommend(
        store,
        user_id=body.user_id,
        branch_id=body.branch_id,
        query=body.query,
    )
