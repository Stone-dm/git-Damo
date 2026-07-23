"""
推荐引擎测试
"""
from __future__ import annotations

import pytest


def test_config_loading():
    """测试配置加载"""
    from app.core.config import settings

    assert settings.APP_NAME == "智慧党建智能体"
    assert settings.LLM_MODEL is not None
    assert settings.EMBEDDING_MODEL is not None


def test_schemas():
    """测试 Pydantic 模型"""
    from app.models.schemas import RecommendRequest, RecommendResponse

    request = RecommendRequest(member_id=1, top_k=5)
    assert request.member_id == 1
    assert request.top_k == 5

    response = RecommendResponse(
        recommendations=[{"id": 1, "title": "test"}],
        reason="推荐原因",
    )
    assert len(response.recommendations) == 1
    assert response.reason == "推荐原因"
