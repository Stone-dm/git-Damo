"""
推荐 API 路由
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.agents.recommend_engine import RecommendEngine
from app.models.schemas import RecommendRequest, RecommendResponse

router = APIRouter(prefix="/api/v1", tags=["个性化推荐"])

recommend_engine = RecommendEngine()


@router.post("/recommend", response_model=RecommendResponse, summary="获取个性化推荐")
async def recommend(request: RecommendRequest):
    """
    根据党员画像和学习历史，生成个性化学习推荐。

    - **member_id**: 党员ID（必填）
    - **top_k**: 推荐数量（默认5，最大20）
    - **category**: 分类过滤（可选）
    - **exclude_ids**: 排除已学课程ID列表
    """
    try:
        result = await recommend_engine.recommend(
            member_id=request.member_id,
            top_k=request.top_k,
            category=request.category,
            exclude_ids=request.exclude_ids,
        )

        return RecommendResponse(
            recommendations=result["recommendations"],
            reason=result.get("reason"),
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推荐生成失败: {str(e)}")
