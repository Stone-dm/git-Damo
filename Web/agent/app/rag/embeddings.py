"""OpenAI-compatible embedding client.

When EMBEDDING_API_KEY is empty, returns deterministic pseudo-vectors so local
pipelines (ingest/search) can be exercised without a paid embedding API.
"""

from __future__ import annotations

import hashlib
import logging
import math
from typing import Sequence

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


def _pseudo_embedding(text: str, dim: int) -> list[float]:
    """Deterministic unit-ish vector derived from text hash (dev/offline only)."""
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values: list[float] = []
    seed = digest
    while len(values) < dim:
        for b in seed:
            # Map byte to [-1, 1]
            values.append((b / 127.5) - 1.0)
            if len(values) >= dim:
                break
        seed = hashlib.sha256(seed).digest()
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]


class EmbeddingClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._client = None
        if self.settings.embedding_api_key:
            try:
                from openai import OpenAI

                kwargs: dict = {"api_key": self.settings.embedding_api_key}
                if self.settings.embedding_base_url:
                    kwargs["base_url"] = self.settings.embedding_base_url
                self._client = OpenAI(**kwargs)
            except Exception as exc:  # pragma: no cover - optional runtime path
                logger.warning("Failed to init embedding client, using pseudo vectors: %s", exc)
                self._client = None
        else:
            logger.info(
                "EMBEDDING_API_KEY empty — using deterministic pseudo-vectors (dim=%s)",
                self.settings.embedding_dim,
            )

    @property
    def dim(self) -> int:
        return self.settings.embedding_dim

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        if self._client is None:
            return [_pseudo_embedding(t, self.dim) for t in texts]

        response = self._client.embeddings.create(
            model=self.settings.embedding_model,
            input=list(texts),
        )
        # Preserve input order by index
        data = sorted(response.data, key=lambda d: d.index)
        return [list(item.embedding) for item in data]

    def embed_one(self, text: str) -> list[float]:
        return self.embed([text])[0]
