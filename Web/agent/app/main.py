"""Party School LangChain Agent — FastAPI entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.ingest import router as ingest_router
from app.api.recommend import router as recommend_router
from app.config import get_settings
from app.security import require_agent_token, warn_if_agent_token_unset
from app.stores.milvus_store import MilvusStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    warn_if_agent_token_unset()
    store = MilvusStore(settings)
    # Soft-fail inside ensure_collections when Milvus is unreachable.
    store.ensure_collections()
    app.state.milvus = store
    logger.info("Agent app started (milvus=%s:%s)", settings.milvus_host, settings.milvus_port)
    yield


app = FastAPI(title="Party School Agent", version="0.1.0", lifespan=lifespan)
app.include_router(health_router)
_secured = [Depends(require_agent_token)]
app.include_router(ingest_router, dependencies=_secured)
app.include_router(recommend_router, dependencies=_secured)
app.include_router(chat_router, dependencies=_secured)
