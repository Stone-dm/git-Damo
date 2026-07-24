"""POST /ingest — chunk → embed → upsert Milvus."""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator

from app.api.payload_compat import empty_if_none
from app.config import get_settings
from app.rag.chunking import chunk_text
from app.rag.embeddings import EmbeddingClient
from app.stores.milvus_store import COLLECTION_LEARNING, COLLECTION_PERSONAL

logger = logging.getLogger(__name__)

router = APIRouter()


class IngestRequest(BaseModel):
    document_id: str
    kb_type: Literal["PERSONAL", "LEARNING"]
    text: str
    user_id: str = ""
    branch_id: str = ""

    @field_validator("user_id", "branch_id", mode="before")
    @classmethod
    def coerce_optional_ids(cls, value: object) -> str:
        return empty_if_none(value)

class IngestResponse(BaseModel):
    status: str = "ok"
    chunks: int = 0
    collection: str = ""


@router.post("/ingest", response_model=IngestResponse)
def ingest(body: IngestRequest, request: Request) -> IngestResponse:
    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    if body.kb_type == "PERSONAL":
        collection = COLLECTION_PERSONAL
    else:
        collection = COLLECTION_LEARNING

    settings = get_settings()
    chunks = chunk_text(body.text)
    if not chunks:
        raise HTTPException(status_code=400, detail="no usable chunks after split")

    embedder = EmbeddingClient(settings)
    vectors = embedder.embed(chunks)

    rows = []
    for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
        row = {
            "chunk_id": f"{body.document_id}_{i}",
            "document_id": body.document_id,
            "text": chunk,
            "embedding": vector,
        }
        if body.kb_type == "PERSONAL":
            row["user_id"] = body.user_id
        else:
            row["branch_id"] = body.branch_id
        rows.append(row)

    store = request.app.state.milvus
    try:
        store.upsert(collection, rows)
    except Exception as exc:
        logger.exception("Ingest upsert failed")
        raise HTTPException(status_code=503, detail=f"vector store unavailable: {exc}") from exc

    return IngestResponse(status="ok", chunks=len(rows), collection=collection)
