"""
学习报告生成器
支持个人学习报告、支部学习统计报告、组织学习分析报告
"""
from __future__ import annotations

import datetime
from typing import Any, Optional

from langchain_core.prompts import ChatPromptTemplate

from app.core.database import DatabaseSession
from app.core.llm import get_chat_model

REPORT_TEMPLATES = {
    "personal": """你是一位智慧党建系统的分析专家。请根据以下数据生成一份**个人学习报告**。

## 报告期间
{start_date} 至 {end_date}

## 党员基本信息
- 姓名：{name}
- 组织：{organization}
- 职务：{position}

## 学习数据
- 学习总时长：{total_hours} 小时
- 完成课程数：{completed_count}
- 平均测试成绩：{avg_score} 分
- 学习课程列表：{courses}

## 各分类学习情况
{category_breakdown}

## 要求
1. 报告标题：{name}同志学习报告（{start_date}至{end_date}）
2. 报告结构：学习概况 → 详细分析 → 亮点与不足 → 改进建议 → 下一步学习计划
3. 语言风格：正式、积极、有建设性
4. 要结合党建工作的特点，体现政治性
5. 改进建议要具体可行
6. 最后给出推荐学习方向
""",

    "department": """你是一位智慧党建系统的分析专家。请根据以下数据生成一份**支部学习统计报告**。

## 报告期间
{start_date} 至 {end_date}

## 组织信息
- 组织名称：{org_name}
- 党员总数：{member_count}

## 学习数据
- 总学习时长：{total_hours} 小时
- 人均学习时长：{avg_hours} 小时
- 参与率：{participation_rate}%
- 平均测试成绩：{avg_score} 分
- 完成课程数：{completed_count}

## 要求
1. 报告标题：{org_name}学习情况报告
2. 报告结构：学习概况 → 数据统计 → 先进典型 → 存在问题 → 工作建议
3. 语言风格：正式、数据分析型
""",

    "organization": """你是一位智慧党建系统的分析专家。请根据以下数据生成一份**组织学习分析报告**。

## 报告期间
{start_date} 至 {end_date}

## 总体数据
- 覆盖组织数：{org_count}
- 总党员数：{member_count}
- 总学习时长：{total_hours} 小时
- 人均学习时长：{avg_hours} 小时
- 总体参与率：{participation_rate}%
- 总体平均成绩：{avg_score} 分

## 各支部对比
{branch_comparison}

## 热门学习内容
{popular_content}

## 要求
1. 报告标题：智慧党建学习情况分析报告
2. 报告结构：总体概况 → 各支部对比分析 → 学习内容分析 → 趋势研判 → 工作建议
3. 语言风格：正式、数据驱动、战略性
""",
}


class ReportGenerator:
    """报告生成器"""

    def __init__(self):
        self.llm = get_chat_model(temperature=0.5)
        self.db = DatabaseSession()

    async def generate(
        self,
        report_type: str,
        member_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        start_date: str = "",
        end_date: str = "",
    ) -> dict[str, Any]:
        """
        生成学习报告

        Args:
            report_type: 报告类型 personal/department/organization
            member_id: 党员ID
            organization_id: 组织ID
            start_date: 开始日期
            end_date: 结束日期

        Returns:
            {"title": str, "content": str, "format": str, "generated_at": str}
        """
        # 收集数据
        data = await self._collect_data(
            report_type=report_type,
            member_id=member_id,
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
        )

        # 获取模板
        template_key = report_type if report_type in REPORT_TEMPLATES else "personal"
        prompt_template = REPORT_TEMPLATES[template_key]

        # 构建提示词
        prompt = ChatPromptTemplate.from_messages([
            ("human", prompt_template),
        ])

        chain = prompt | self.llm

        result = await chain.ainvoke(data)

        content = result.content if hasattr(result, "content") else str(result)

        title = self._generate_title(report_type, data)

        return {
            "title": title,
            "content": content,
            "format": "markdown",
            "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

    async def _collect_data(
        self,
        report_type: str,
        member_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        start_date: str = "",
        end_date: str = "",
    ) -> dict[str, Any]:
        """收集报告所需数据"""
        data = {
            "start_date": start_date,
            "end_date": end_date,
        }

        with self.db.get_sync_session() as session:
            if report_type == "personal" and member_id:
                from app.models.database import (
                    Course,
                    LearningRecord,
                    Organization,
                    PartyMember,
                )

                member = (
                    session.query(PartyMember)
                    .filter(PartyMember.id == member_id)
                    .first()
                )
                if not member:
                    raise ValueError(f"党员不存在: {member_id}")

                data["name"] = member.name
                data["organization"] = member.organization.name if member.organization else ""
                data["position"] = member.position or "普通党员"

                records = (
                    session.query(LearningRecord)
                    .filter(LearningRecord.member_id == member_id)
                    .all()
                )

                courses = []
                total_minutes = 0
                total_score = 0.0
                score_count = 0
                cat_breakdown: dict[str, dict] = {}

                for r in records:
                    if r.course:
                        courses.append(f"{r.course.title}({r.test_score or '未测试'}分)")
                        total_minutes += r.duration_minutes or 0
                        if r.test_score is not None:
                            total_score += r.test_score
                            score_count += 1

                        cat = r.course.category or "其他"
                        if cat not in cat_breakdown:
                            cat_breakdown[cat] = {"count": 0, "total_score": 0.0, "score_count": 0}
                        cat_breakdown[cat]["count"] += 1
                        if r.test_score is not None:
                            cat_breakdown[cat]["total_score"] += r.test_score
                            cat_breakdown[cat]["score_count"] += 1

                data["total_hours"] = round(total_minutes / 60, 1)
                data["completed_count"] = len([r for r in records if r.status == "completed"])
                data["avg_score"] = round(total_score / score_count, 1) if score_count > 0 else 0
                data["courses"] = "、".join(courses) if courses else "暂无"
                data["category_breakdown"] = "\n".join(
                    f"- {cat}: {info['count']}门课程, "
                    f"平均{round(info['total_score']/info['score_count'], 1) if info['score_count'] > 0 else 0}分"
                    for cat, info in cat_breakdown.items()
                ) if cat_breakdown else "暂无数据"

            elif report_type == "department" and organization_id:
                from app.models.database import LearningRecord, Organization, PartyMember

                org = session.query(Organization).filter(Organization.id == organization_id).first()
                if not org:
                    raise ValueError(f"组织不存在: {organization_id}")

                members = session.query(PartyMember).filter(PartyMember.organization_id == organization_id).all()
                member_ids = [m.id for m in members]

                records = (
                    session.query(LearningRecord)
                    .filter(LearningRecord.member_id.in_(member_ids))
                    .all()
                )

                total_minutes = sum(r.duration_minutes or 0 for r in records)
                scores = [r.test_score for r in records if r.test_score is not None]
                completed = len([r for r in records if r.status == "completed"])

                data["org_name"] = org.name
                data["member_count"] = len(members)
                data["total_hours"] = round(total_minutes / 60, 1)
                data["avg_hours"] = round(total_minutes / 60 / len(members), 1) if members else 0
                data["participation_rate"] = round(
                    len(set(r.member_id for r in records)) / len(members) * 100, 1
                ) if members else 0
                data["avg_score"] = round(sum(scores) / len(scores), 1) if scores else 0
                data["completed_count"] = completed

            elif report_type == "organization":
                from app.models.database import LearningRecord, Organization, PartyMember

                orgs = session.query(Organization).all()
                all_members = session.query(PartyMember).all()
                all_records = session.query(LearningRecord).all()

                total_minutes = sum(r.duration_minutes or 0 for r in all_records)
                scores = [r.test_score for r in all_records if r.test_score is not None]

                data["org_count"] = len(orgs)
                data["member_count"] = len(all_members)
                data["total_hours"] = round(total_minutes / 60, 1)
                data["avg_hours"] = round(total_minutes / 60 / len(all_members), 1) if all_members else 0
                data["participation_rate"] = round(
                    len(set(r.member_id for r in all_records)) / len(all_members) * 100, 1
                ) if all_members else 0
                data["avg_score"] = round(sum(scores) / len(scores), 1) if scores else 0

                # 各支部对比
                branch_data = []
                for org in orgs:
                    m_ids = [m.id for m in org.members]
                    o_records = [r for r in all_records if r.member_id in m_ids]
                    if m_ids:
                        o_hours = round(sum(r.duration_minutes or 0 for r in o_records) / 60, 1)
                        o_scores = [r.test_score for r in o_records if r.test_score is not None]
                        branch_data.append(
                            f"- {org.name}: {len(m_ids)}人, 总学习{o_hours}小时, "
                            f"平均{round(sum(o_scores)/len(o_scores), 1) if o_scores else 0}分"
                        )
                data["branch_comparison"] = "\n".join(branch_data) if branch_data else "暂无数据"
                data["popular_content"] = "（待数据积累后分析）"

        return data

    def _generate_title(self, report_type: str, data: dict) -> str:
        """生成报告标题"""
        today = datetime.datetime.now().strftime("%Y年%m月%d日")
        titles = {
            "personal": f"{data.get('name', '')}同志学习报告",
            "department": f"{data.get('org_name', '')}学习情况报告",
            "organization": "智慧党建学习情况分析报告",
        }
        title = titles.get(report_type, "学习报告")
        return f"{title}（{today}）"
