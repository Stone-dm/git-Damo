"""Optional shared-secret check for agent HTTP surface."""

from __future__ import annotations

import logging

from fastapi import Header, HTTPException

from app.config import get_settings

logger = logging.getLogger(__name__)

_warned_open = False


def warn_if_agent_token_unset() -> None:
    """Log once at startup when AGENT_SHARED_TOKEN is empty (dev mode)."""
    global _warned_open
    settings = get_settings()
    if (settings.agent_shared_token or "").strip():
        return
    if not _warned_open:
        logger.warning(
            "AGENT_SHARED_TOKEN is empty; agent API is open (dev mode). "
            "Set AGENT_SHARED_TOKEN and send X-Agent-Token from the backend."
        )
        _warned_open = True


def require_agent_token(
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
) -> None:
    """Reject requests when a shared token is configured but missing/wrong."""
    expected = (get_settings().agent_shared_token or "").strip()
    if not expected:
        return
    if (x_agent_token or "").strip() != expected:
        raise HTTPException(status_code=401, detail="invalid or missing X-Agent-Token")
