"""Coerce Agent request fields to match Backend JSON (null → empty / defaults)."""

from __future__ import annotations

from typing import Any

DEFAULT_RECOMMEND_QUERY = "推荐学习"


def empty_if_none(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def recommend_query(value: Any) -> str:
    if value is None:
        return DEFAULT_RECOMMEND_QUERY
    text = str(value).strip()
    return text if text else DEFAULT_RECOMMEND_QUERY
