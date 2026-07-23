"""
SQL 查询工具 - LangChain Tool
用于智能体查询数据库中的组织和党员信息
"""
from __future__ import annotations

from typing import Optional, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from app.core.database import DatabaseSession


class QueryDatabaseInput(BaseModel):
    """SQL 查询参数"""
    sql: str = Field(description="要执行的 SQL 查询语句（仅 SELECT）")
    params: Optional[dict] = Field(default=None, description="查询参数")


class DatabaseQueryTool(BaseTool):
    """数据库查询工具"""
    name: str = "query_database"
    description: str = """
    查询党建系统的数据库，获取组织和党员信息。
    输入应为 SQL SELECT 查询语句。
    可查询的表: organizations(党组织), party_members(党员), courses(课程), learning_records(学习记录)
    示例: "SELECT * FROM organizations LIMIT 5"
    """
    args_schema: Type[BaseModel] = QueryDatabaseInput

    def _run(self, sql: str, params: Optional[dict] = None) -> str:
        """执行 SQL 查询"""
        db = DatabaseSession()
        try:
            with db.get_sync_session() as session:
                result = session.execute(sql)
                rows = result.fetchall()
                columns = result.keys()

                if not rows:
                    return "查询结果为空"

                # 格式化结果
                output = []
                for row in rows:
                    row_dict = dict(zip(columns, row))
                    output.append(str(row_dict))

                return "\n".join(output)
        except Exception as e:
            return f"查询执行失败: {str(e)}"


# 导出工具实例
query_database = DatabaseQueryTool()
