"""POST /parse-task — parse natural-language task description into structured fields."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import get_settings
from app.llm.deepseek import DeepSeekClient

router = APIRouter()

SYSTEM_PROMPT = """\
你是党校教育管理系统的任务解析助手。用户会用自然语言描述一个任务下发需求，你需要从中提取结构化信息。

请严格返回以下 JSON 格式（不要返回其他内容）：
{
  "title": "任务标题（简洁概括）",
  "type": "LEARNING 或 EXAM",
  "description": "任务详细描述",
  "targetType": "ALL 或 BRANCH",
  "branchIds": [目标支部ID数组，如果是全体则为空数组],
  "deadline": "截止日期，ISO格式如 2026-08-01，无法推断则为 null"
}

规则：
- type：涉及考试/测验/答题用 EXAM，其余用 LEARNING
- targetType：提到具体支部用 BRANCH，否则用 ALL
- branchIds：如果提到"第一支部"则填[1]，"第二支部"填[2]，依此类推；多个支部填多个ID
- deadline：如果提到"本周"则为本周日日期，"明天"则为明天日期，无时间要求则为 null
- title：从描述中提炼一个简短标题
"""


class ParseTaskRequest(BaseModel):
    text: str = Field(..., min_length=1)


class ParseTaskResponse(BaseModel):
    title: str
    type: Literal["LEARNING", "EXAM"]
    description: str
    targetType: Literal["ALL", "BRANCH"]
    branchIds: list[int] = Field(default_factory=list)
    deadline: str | None = None


@router.post("/parse-task", response_model=ParseTaskResponse)
def parse_task(body: ParseTaskRequest) -> dict:
    settings = get_settings()
    llm = DeepSeekClient(settings)

    if not llm.available:
        raise HTTPException(status_code=503, detail="LLM service unavailable")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": body.text},
    ]

    try:
        result = llm.complete_json(messages)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=502, detail=f"LLM parse failed: {exc}")

    return {
        "title": result.get("title", ""),
        "type": result.get("type", "LEARNING"),
        "description": result.get("description", ""),
        "targetType": result.get("targetType", "ALL"),
        "branchIds": result.get("branchIds", []),
        "deadline": result.get("deadline"),
    }
