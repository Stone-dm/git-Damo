"""
个性化推荐引擎
结合协同过滤、基于内容推荐和 LLM 重排
"""
from __future__ import annotations

from typing import Any, Optional

from langchain_core.prompts import ChatPromptTemplate

from app.core.database import DatabaseSession
from app.core.llm import get_chat_model

RECOMMEND_PROMPT = """你是一位智慧党建系统的个性化学习推荐专家。

## 党员信息
- 姓名：{member_name}
- 组织：{organization}
- 职务：{position}
- 画像标签：{profile_tags}

## 学习历史摘要
- 已完成课程：{completed_courses}
- 平均成绩：{avg_score}
- 学习总时长：{total_hours} 小时
- 偏好分类：{preferred_categories}

## 可选课程列表
{candidates}

## 任务
请根据以上党员信息，从候选课程中推荐最合适的 {top_k} 个课程。
对每个推荐课程，请给出推荐理由，要结合该党员的具体情况。
要求推荐的课程与该党员未学过的内容互补。

## 输出格式
请按以下格式输出：
1. **课程标题** - 推荐理由（结合党员画像解释）
2. **课程标题** - 推荐理由
...
"""


class RecommendEngine:
    """推荐引擎"""

    def __init__(self):
        self.llm = get_chat_model(temperature=0.4)
        self.db = DatabaseSession()

    async def recommend(
        self,
        member_id: int,
        top_k: int = 5,
        category: Optional[str] = None,
        exclude_ids: Optional[list[int]] = None,
    ) -> dict[str, Any]:
        """
        生成个性化推荐

        Args:
            member_id: 党员ID
            top_k: 推荐数量
            category: 分类过滤
            exclude_ids: 排除的课程ID

        Returns:
            {
                "recommendations": list[dict],
                "reason": str
            }
        """
        # 1. 获取党员信息
        member_info = self._get_member_info(member_id)

        # 2. 获取学习历史
        learning_history = self._get_learning_history(member_id)

        # 3. 获取候选课程
        candidates = self._get_candidate_courses(
            member_id=member_id,
            category=category,
            exclude_ids=exclude_ids or [],
        )

        # 4. 使用 LLM 进行智能推荐排序
        recommendations_with_reason = await self._llm_recommend(
            member_info=member_info,
            learning_history=learning_history,
            candidates=candidates[:20],  # 取前20个候选
            top_k=top_k,
        )

        return {
            "recommendations": recommendations_with_reason["recommendations"],
            "reason": recommendations_with_reason.get("reason", ""),
        }

    def _get_member_info(self, member_id: int) -> dict[str, Any]:
        """获取党员信息"""
        with self.db.get_sync_session() as session:
            from app.models.database import PartyMember, Organization

            member = (
                session.query(PartyMember)
                .filter(PartyMember.id == member_id)
                .first()
            )
            if not member:
                raise ValueError(f"党员不存在: member_id={member_id}")

            org_name = ""
            if member.organization:
                org_name = member.organization.name

            return {
                "id": member.id,
                "name": member.name,
                "organization": org_name,
                "position": member.position or "普通党员",
                "profile_tags": member.profile_tags or [],
            }

    def _get_learning_history(self, member_id: int) -> dict[str, Any]:
        """获取学习历史"""
        with self.db.get_sync_session() as session:
            from app.models.database import Course, LearningRecord

            records = (
                session.query(LearningRecord)
                .filter(LearningRecord.member_id == member_id)
                .all()
            )

            completed = []
            total_score = 0.0
            score_count = 0
            total_minutes = 0
            category_count: dict[str, int] = {}

            for record in records:
                if record.course:
                    completed.append(record.course.title)
                    total_minutes += record.duration_minutes or 0

                    if record.test_score is not None:
                        total_score += record.test_score
                        score_count += 1

                    cat = record.course.category or "其他"
                    category_count[cat] = category_count.get(cat, 0) + 1

            avg_score = round(total_score / score_count, 1) if score_count > 0 else 0
            preferred = sorted(category_count, key=category_count.get, reverse=True)

            return {
                "completed_courses": completed,
                "avg_score": avg_score,
                "total_hours": round(total_minutes / 60, 1),
                "preferred_categories": preferred[:3],
            }

    def _get_candidate_courses(
        self,
        member_id: int,
        category: Optional[str] = None,
        exclude_ids: Optional[list[int]] = None,
    ) -> list[dict[str, Any]]:
        """获取候选课程"""
        with self.db.get_sync_session() as session:
            from app.models.database import Course

            query = session.query(Course)
            if category:
                query = query.filter(Course.category == category)
            if exclude_ids:
                query = query.filter(Course.id.notin_(exclude_ids))

            courses = query.limit(50).all()

            return [
                {
                    "id": c.id,
                    "title": c.title,
                    "description": c.description or "",
                    "category": c.category or "",
                    "tags": c.tags or [],
                    "difficulty": c.difficulty or "",
                    "duration_minutes": c.duration_minutes or 0,
                    "is_required": c.is_required or 0,
                }
                for c in courses
            ]

    async def _llm_recommend(
        self,
        member_info: dict,
        learning_history: dict,
        candidates: list[dict],
        top_k: int,
    ) -> dict:
        """使用 LLM 进行智能推荐"""
        candidate_text = "\n".join(
            f"- [{c['category']}] {c['title']} ({c['difficulty']}, {c['duration_minutes']}分钟)"
            f"\n  描述：{c['description'][:100] if c.get('description') else '无'}"
            for c in candidates
        )

        prompt = ChatPromptTemplate.from_messages([
            ("human", RECOMMEND_PROMPT),
        ])

        chain = prompt | self.llm

        result = await chain.ainvoke({
            "member_name": member_info["name"],
            "organization": member_info["organization"],
            "position": member_info["position"],
            "profile_tags": ", ".join(member_info["profile_tags"]) if member_info["profile_tags"] else "无",
            "completed_courses": ", ".join(learning_history["completed_courses"]) or "无",
            "avg_score": learning_history["avg_score"],
            "total_hours": learning_history["total_hours"],
            "preferred_categories": ", ".join(learning_history["preferred_categories"]) or "无",
            "candidates": candidate_text,
            "top_k": top_k,
        })

        content = result.content if hasattr(result, "content") else str(result)

        # 解析推荐结果
        recommendations = []
        for line in content.strip().split("\n"):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith("-")):
                recommendations.append({"text": line})

        return {
            "recommendations": recommendations,
            "reason": content,
        }
