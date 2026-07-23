#!/usr/bin/env python
"""
测试数据导入脚本
插入示例党组织、党员、课程和学习记录数据
"""
from __future__ import annotations

import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SyncSessionLocal
from app.models.database import (
    Course,
    LearningRecord,
    Organization,
    PartyMember,
)


def seed():
    """导入测试数据"""
    print("🌱 正在导入测试数据...\n")

    session = SyncSessionLocal()
    try:
        # ---- 1. 创建党组织 ----
        print("📁 创建党组织...")
        org_party = Organization(
            name="中共XX市委员会",
            level="党委",
            description="市级党委组织",
        )
        session.add(org_party)
        session.flush()

        org_dept1 = Organization(
            name="机关第一党支部",
            parent_id=org_party.id,
            level="党支部",
            description="机关第一党支部",
        )
        org_dept2 = Organization(
            name="机关第二党支部",
            parent_id=org_party.id,
            level="党支部",
            description="机关第二党支部",
        )
        session.add_all([org_dept1, org_dept2])
        session.flush()

        # ---- 2. 创建党员 ----
        print("👤 创建党员...")
        members = [
            PartyMember(
                name="张三",
                organization_id=org_dept1.id,
                position="支部书记",
                join_date=datetime.date(2015, 6, 1),
                profile_tags=["党务骨干", "理论学习", "青年党员"],
            ),
            PartyMember(
                name="李四",
                organization_id=org_dept1.id,
                position="组织委员",
                join_date=datetime.date(2018, 9, 1),
                profile_tags=["组织工作", "党史学习"],
            ),
            PartyMember(
                name="王五",
                organization_id=org_dept2.id,
                position="普通党员",
                join_date=datetime.date(2020, 7, 1),
                profile_tags=["新党员", "理论学习"],
            ),
            PartyMember(
                name="赵六",
                organization_id=org_dept2.id,
                position="宣传委员",
                join_date=datetime.date(2019, 3, 1),
                profile_tags=["宣传工作", "政策学习"],
            ),
        ]
        session.add_all(members)
        session.flush()

        # ---- 3. 创建课程 ----
        print("📚 创建课程...")
        courses = [
            Course(
                title="习近平新时代中国特色社会主义思想学习纲要",
                description="系统学习习近平新时代中国特色社会主义思想的权威教材",
                content_type="article",
                category="理论",
                tags=["思想理论", "习近平新时代中国特色社会主义思想"],
                difficulty="advanced",
                duration_minutes=120,
                is_required=1,
            ),
            Course(
                title="中国共产党简史",
                description="全面了解中国共产党百年奋斗历程",
                content_type="article",
                category="党史",
                tags=["党史", "百年历程"],
                difficulty="intermediate",
                duration_minutes=90,
                is_required=1,
            ),
            Course(
                title="党的二十大报告精神解读",
                description="深入解读党的二十大报告的重要内容",
                content_type="video",
                category="政策",
                tags=["二十大", "政策解读"],
                difficulty="intermediate",
                duration_minutes=60,
                is_required=1,
            ),
            Course(
                title="《中国共产党纪律处分条例》解读",
                description="学习党的纪律处分条例，增强纪律意识",
                content_type="article",
                category="法规",
                tags=["纪律", "法规"],
                difficulty="intermediate",
                duration_minutes=45,
                is_required=0,
            ),
            Course(
                title="三会一课制度详解",
                description="了解三会一课制度的内容和要求",
                content_type="video",
                category="党务",
                tags=["三会一课", "组织生活"],
                difficulty="beginner",
                duration_minutes=30,
                is_required=1,
            ),
            Course(
                title="党史学习教育：井冈山精神",
                description="学习井冈山精神的深刻内涵和时代价值",
                content_type="article",
                category="党史",
                tags=["党史", "井冈山精神"],
                difficulty="beginner",
                duration_minutes=40,
                is_required=0,
            ),
            Course(
                title="新时代党员先锋模范作用",
                description="探讨新时代党员如何发挥先锋模范作用",
                content_type="video",
                category="理论",
                tags=["党员", "先锋模范"],
                difficulty="intermediate",
                duration_minutes=50,
                is_required=0,
            ),
            Course(
                title="基层党组织建设工作实务",
                description="详解基层党建工作的实务操作方法",
                content_type="article",
                category="党务",
                tags=["基层党建", "实务"],
                difficulty="advanced",
                duration_minutes=80,
                is_required=0,
            ),
        ]
        session.add_all(courses)
        session.flush()

        # ---- 4. 创建学习记录 ----
        print("📝 创建学习记录...")
        records = [
            LearningRecord(
                member_id=members[0].id,  # 张三
                course_id=courses[0].id,
                duration_minutes=120,
                progress=100.0,
                test_score=95.0,
                status="completed",
            ),
            LearningRecord(
                member_id=members[0].id,
                course_id=courses[1].id,
                duration_minutes=90,
                progress=100.0,
                test_score=88.0,
                status="completed",
            ),
            LearningRecord(
                member_id=members[0].id,
                course_id=courses[2].id,
                duration_minutes=60,
                progress=100.0,
                test_score=90.0,
                status="completed",
            ),
            LearningRecord(
                member_id=members[1].id,  # 李四
                course_id=courses[0].id,
                duration_minutes=120,
                progress=100.0,
                test_score=85.0,
                status="completed",
            ),
            LearningRecord(
                member_id=members[1].id,
                course_id=courses[3].id,
                duration_minutes=45,
                progress=100.0,
                test_score=92.0,
                status="completed",
            ),
            LearningRecord(
                member_id=members[2].id,  # 王五
                course_id=courses[1].id,
                duration_minutes=60,
                progress=70.0,
                test_score=None,
                status="in_progress",
            ),
            LearningRecord(
                member_id=members[2].id,
                course_id=courses[4].id,
                duration_minutes=30,
                progress=100.0,
                test_score=78.0,
                status="completed",
            ),
            LearningRecord(
                member_id=members[3].id,  # 赵六
                course_id=courses[2].id,
                duration_minutes=60,
                progress=100.0,
                test_score=82.0,
                status="completed",
            ),
            LearningRecord(
                member_id=members[3].id,
                course_id=courses[3].id,
                duration_minutes=45,
                progress=100.0,
                test_score=90.0,
                status="completed",
            ),
        ]
        session.add_all(records)

        session.commit()

        # ---- 输出统计 ----
        print(f"\n📊 数据导入统计:")
        print(f"  党组织: {3} 个")
        print(f"  党员: {len(members)} 人")
        print(f"  课程: {len(courses)} 门")
        print(f"  学习记录: {len(records)} 条")
        print("\n🎉 测试数据导入完成！")

    except Exception as e:
        session.rollback()
        print(f"❌ 导入失败: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
