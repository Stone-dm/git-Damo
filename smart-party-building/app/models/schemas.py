"""
Pydantic 数据模型 - API 请求/响应
"""
from __future__ import annotations

import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ===================== 通用 =====================

class Message(BaseModel):
    """通用消息响应"""
    message: str
    code: int = 200


# ===================== 查询模块 =====================

class QueryRequest(BaseModel):
    """查询请求"""
    query: str = Field(..., description="用户查询内容")
    member_id: Optional[int] = Field(None, description="党员ID（用于个性化上下文）")
    conversation_id: Optional[str] = Field(None, description="会话ID（多轮对话）")
    history: list[dict[str, str]] = Field(default=[], description="对话历史")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "请介绍一下三会一课制度",
                "member_id": 1,
                "conversation_id": None,
                "history": [],
            }
        }


class QueryResponse(BaseModel):
    """查询响应"""
    answer: str = Field(..., description="回答内容")
    sources: list[dict[str, Any]] = Field(default=[], description="引用来源")
    conversation_id: Optional[str] = Field(None, description="会话ID")
    processing_time: float = Field(0.0, description="处理耗时(秒)")


# ===================== 推荐模块 =====================

class RecommendRequest(BaseModel):
    """推荐请求"""
    member_id: int = Field(..., description="党员ID")
    top_k: int = Field(5, ge=1, le=20, description="推荐数量")
    category: Optional[str] = Field(None, description="推荐分类过滤")
    exclude_ids: list[int] = Field(default=[], description="排除已学课程ID")

    class Config:
        json_schema_extra = {
            "example": {
                "member_id": 1,
                "top_k": 5,
                "category": "党史",
                "exclude_ids": [1, 2, 3],
            }
        }


class RecommendResponse(BaseModel):
    """推荐响应"""
    recommendations: list[dict[str, Any]] = Field(..., description="推荐列表")
    reason: Optional[str] = Field(None, description="推荐理由（LLM 生成）")


# ===================== 报告模块 =====================

class ReportRequest(BaseModel):
    """报告生成请求"""
    report_type: str = Field(..., description="报告类型: personal/department/organization")
    member_id: Optional[int] = Field(None, description="党员ID（个人报告时必填）")
    organization_id: Optional[int] = Field(None, description="组织ID（部门/组织报告时必填）")
    start_date: str = Field(..., description="开始日期 YYYY-MM-DD")
    end_date: str = Field(..., description="结束日期 YYYY-MM-DD")
    format: str = Field("markdown", description="输出格式: markdown/html")

    class Config:
        json_schema_extra = {
            "example": {
                "report_type": "personal",
                "member_id": 1,
                "organization_id": None,
                "start_date": "2026-01-01",
                "end_date": "2026-06-30",
                "format": "markdown",
            }
        }


class ReportResponse(BaseModel):
    """报告生成响应"""
    title: str = Field(..., description="报告标题")
    content: str = Field(..., description="报告内容")
    format: str = Field("markdown", description="输出格式")
    generated_at: str = Field(..., description="生成时间")


# ===================== 对话模块 =====================

class ChatRequest(BaseModel):
    """多轮对话请求"""
    message: str = Field(..., description="用户消息")
    member_id: Optional[int] = Field(None, description="党员ID")
    conversation_id: Optional[str] = Field(None, description="会话ID")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "我想学习最新的党建知识",
                "member_id": 1,
                "conversation_id": None,
            }
        }


class ChatResponse(BaseModel):
    """对话响应"""
    reply: str = Field(..., description="智能体回复")
    conversation_id: str = Field(..., description="会话ID")
    sources: list[dict[str, Any]] = Field(default=[], description="参考来源")
    suggestions: list[str] = Field(default=[], description="推荐追问")
