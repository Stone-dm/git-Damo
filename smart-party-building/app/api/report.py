"""
报告生成 API 路由
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.agents.report_generator import ReportGenerator
from app.models.schemas import ReportRequest, ReportResponse

router = APIRouter(prefix="/api/v1/report", tags=["学习报告"])

report_generator = ReportGenerator()


@router.post("/generate", response_model=ReportResponse, summary="生成学习报告")
async def generate_report(request: ReportRequest):
    """
    生成党员学习报告。

    - **report_type**: 报告类型
      - personal: 个人学习报告（需提供 member_id）
      - department: 支部学习统计报告（需提供 organization_id）
      - organization: 组织学习分析报告
    - **member_id**: 党员ID（个人报告必填）
    - **organization_id**: 组织ID（支部报告必填）
    - **start_date**: 开始日期 YYYY-MM-DD
    - **end_date**: 结束日期 YYYY-MM-DD
    - **format**: 输出格式 markdown/html
    """
    try:
        result = await report_generator.generate(
            report_type=request.report_type,
            member_id=request.member_id,
            organization_id=request.organization_id,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        return ReportResponse(
            title=result["title"],
            content=result["content"],
            format=result["format"],
            generated_at=result["generated_at"],
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"报告生成失败: {str(e)}")


@router.get("/list", summary="获取报告列表")
async def list_reports(member_id: int | None = None, report_type: str | None = None):
    """
    获取已生成的报告列表（待实现历史存储功能）。
    """
    return {"message": "报告列表功能开发中", "reports": []}
