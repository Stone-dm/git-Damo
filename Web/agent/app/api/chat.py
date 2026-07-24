"""POST /chat — assistant summarize / RAG Q&A."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field, field_validator

from app.api.payload_compat import empty_if_none
from app.assistant.chain import chat as run_chat

router = APIRouter()


class HistoryItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    user_id: str = ""
    branch_id: str = ""
    role: str = "MEMBER"
    message: str = Field(..., min_length=1)
    document_id: str | None = None
    text: str | None = None
    history: list[HistoryItem] = Field(default_factory=list)

    @field_validator("user_id", "branch_id", mode="before")
    @classmethod
    def coerce_ids(cls, value: object) -> str:
        return empty_if_none(value)

    @field_validator("role", mode="before")
    @classmethod
    def coerce_role(cls, value: object) -> str:
        if value is None or str(value).strip() == "":
            return "MEMBER"
        return str(value).strip()


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, request: Request) -> dict[str, Any]:
    store = request.app.state.milvus
    return run_chat(
        store,
        user_id=body.user_id,
        branch_id=body.branch_id,
        role=body.role,
        message=body.message,
        document_id=body.document_id,
        text=body.text,
        history=[h.model_dump() for h in body.history],
    )
