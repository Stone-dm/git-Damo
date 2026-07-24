"""POST /recommend — dual-KB retrieval + DeepSeek recommend."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel, field_validator

from app.api.payload_compat import empty_if_none, recommend_query
from app.recommend.chain import recommend as run_recommend

router = APIRouter()


class RecommendRequest(BaseModel):
    user_id: str = ""
    branch_id: str = ""
    query: str = "推荐学习"

    @field_validator("user_id", "branch_id", mode="before")
    @classmethod
    def coerce_ids(cls, value: object) -> str:
        return empty_if_none(value)

    @field_validator("query", mode="before")
    @classmethod
    def coerce_query(cls, value: object) -> str:
        return recommend_query(value)

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
