"""Party School LangChain Agent — FastAPI entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.health import router as health_router
from app.config import get_settings
from app.stores.milvus_store import MilvusStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    store = MilvusStore(settings)
    # Soft-fail inside ensure_collections when Milvus is unreachable.
    store.ensure_collections()
    app.state.milvus = store
    logger.info("Agent app started (milvus=%s:%s)", settings.milvus_host, settings.milvus_port)
    yield


app = FastAPI(title="Party School Agent", version="0.1.0", lifespan=lifespan)
app.include_router(health_router)
