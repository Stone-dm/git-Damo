"""
健康检查 API
"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["系统"])


@router.get("/health", summary="健康检查")
async def health_check():
    """检查服务运行状态"""
    return {
        "status": "healthy",
        "service": "智慧党建智能体",
        "version": "1.0.0",
    }
