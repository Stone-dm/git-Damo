"""
报告生成器测试
"""
from __future__ import annotations

import pytest


def test_report_schemas():
    """测试报告相关 Pydantic 模型"""
    from app.models.schemas import ReportRequest, ReportResponse

    request = ReportRequest(
        report_type="personal",
        member_id=1,
        start_date="2026-01-01",
        end_date="2026-06-30",
    )
    assert request.report_type == "personal"
    assert request.member_id == 1

    response = ReportResponse(
        title="张三学习报告",
        content="# 学习报告\n\n内容...",
        format="markdown",
        generated_at="2026-07-23 10:00:00",
    )
    assert "学习报告" in response.title
    assert response.format == "markdown"


def test_query_schemas():
    """测试查询相关 Pydantic 模型"""
    from app.models.schemas import QueryRequest, QueryResponse

    request = QueryRequest(query="什么是三会一课")
    assert request.query == "什么是三会一课"

    response = QueryResponse(
        answer="三会一课是指...",
        sources=[{"title": "党支部工作条例"}],
        processing_time=1.23,
    )
    assert "三会一课" in response.answer
    assert len(response.sources) > 0
