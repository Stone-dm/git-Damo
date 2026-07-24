"""Milvus vector store for kb_personal and kb_learning collections."""

from __future__ import annotations

import logging
from typing import Any

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    connections,
    utility,
)

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

COLLECTION_PERSONAL = "kb_personal"
COLLECTION_LEARNING = "kb_learning"

_VARCHAR_MAX = 65535


class MilvusStore:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._connected = False

    @property
    def dim(self) -> int:
        return self.settings.embedding_dim

    def connect(self) -> None:
        connections.connect(
            alias="default",
            host=self.settings.milvus_host,
            port=str(self.settings.milvus_port),
        )
        self._connected = True

    def ensure_collections(self) -> None:
        """Create kb_personal / kb_learning if missing. Soft-fails when Milvus is down."""
        try:
            self.connect()
            self._ensure_personal()
            self._ensure_learning()
            logger.info(
                "Milvus collections ready: %s, %s (dim=%s)",
                COLLECTION_PERSONAL,
                COLLECTION_LEARNING,
                self.dim,
            )
        except Exception as exc:
            # Docker Hub / Milvus may be unavailable in local env — do not crash the API.
            logger.warning(
                "Milvus ensure_collections failed (host=%s:%s): %s — continuing without vectors",
                self.settings.milvus_host,
                self.settings.milvus_port,
                exc,
            )
            self._connected = False

    def _ensure_personal(self) -> None:
        if utility.has_collection(COLLECTION_PERSONAL):
            return
        fields = [
            FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, is_primary=True, max_length=128),
            FieldSchema(name="document_id", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="user_id", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=_VARCHAR_MAX),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dim),
        ]
        schema = CollectionSchema(fields, description="PERSONAL knowledge chunks")
        collection = Collection(name=COLLECTION_PERSONAL, schema=schema)
        collection.create_index(
            field_name="embedding",
            index_params={
                "index_type": "IVF_FLAT",
                "metric_type": "IP",
                "params": {"nlist": 128},
            },
        )

    def _ensure_learning(self) -> None:
        if utility.has_collection(COLLECTION_LEARNING):
            return
        fields = [
            FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, is_primary=True, max_length=128),
            FieldSchema(name="document_id", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="branch_id", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=_VARCHAR_MAX),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dim),
        ]
        schema = CollectionSchema(fields, description="LEARNING knowledge chunks")
        collection = Collection(name=COLLECTION_LEARNING, schema=schema)
        collection.create_index(
            field_name="embedding",
            index_params={
                "index_type": "IVF_FLAT",
                "metric_type": "IP",
                "params": {"nlist": 128},
            },
        )

    def upsert(self, collection: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        if not self._connected:
            self.connect()
        col = Collection(collection)
        col.load()

        if collection == COLLECTION_PERSONAL:
            data = [
                [r["chunk_id"] for r in rows],
                [str(r["document_id"]) for r in rows],
                [str(r.get("user_id", "")) for r in rows],
                [r["text"] for r in rows],
                [r["embedding"] for r in rows],
            ]
        elif collection == COLLECTION_LEARNING:
            data = [
                [r["chunk_id"] for r in rows],
                [str(r["document_id"]) for r in rows],
                [str(r.get("branch_id") or "") for r in rows],
                [r["text"] for r in rows],
                [r["embedding"] for r in rows],
            ]
        else:
            raise ValueError(f"Unknown collection: {collection}")

        col.upsert(data)

    def search(
        self,
        collection: str,
        vector: list[float],
        filter_expr: str,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        if not self._connected:
            self.connect()
        col = Collection(collection)
        col.load()
        results = col.search(
            data=[vector],
            anns_field="embedding",
            param={"metric_type": "IP", "params": {"nprobe": 16}},
            limit=top_k,
            expr=filter_expr or None,
            output_fields=["text", "document_id"],
        )
        hits: list[dict[str, Any]] = []
        for hit in results[0]:
            entity = hit.entity
            hits.append(
                {
                    "text": entity.get("text"),
                    "document_id": entity.get("document_id"),
                    "score": float(hit.score),
                }
            )
        return hits
