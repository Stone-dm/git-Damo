"""OpenAI-compatible DeepSeek chat client."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


class DeepSeekClient:
    """Thin wrapper around OpenAI SDK pointed at DeepSeek.

    When DEEPSEEK_API_KEY is empty, ``available`` is False and callers should degrade.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._client = None
        if self.settings.deepseek_api_key:
            try:
                from openai import OpenAI

                self._client = OpenAI(
                    api_key=self.settings.deepseek_api_key,
                    base_url=self.settings.deepseek_base_url,
                )
            except Exception as exc:  # pragma: no cover
                logger.warning("Failed to init DeepSeek client: %s", exc)
                self._client = None
        else:
            logger.info("DEEPSEEK_API_KEY empty — LLM calls will degrade")

    @property
    def available(self) -> bool:
        return self._client is not None

    def complete(self, messages: list[dict[str, str]], *, temperature: float = 0.3) -> str:
        if not self._client:
            raise RuntimeError("DeepSeek client unavailable")
        response = self._client.chat.completions.create(
            model=self.settings.deepseek_model,
            messages=messages,
            temperature=temperature,
        )
        return (response.choices[0].message.content or "").strip()

    def complete_json(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.2,
    ) -> dict[str, Any]:
        """Ask for JSON; best-effort parse with fence stripping."""
        text = self.complete(messages, temperature=temperature)
        return _parse_json_object(text)


def _parse_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    # Fallback: find first {...} block
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        data = json.loads(cleaned[start : end + 1])
        if isinstance(data, dict):
            return data
    raise ValueError(f"Could not parse JSON from LLM response: {text[:200]}")
