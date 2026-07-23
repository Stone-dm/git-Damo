"""
计算工具 - LangChain Tool
用于智能体进行数据统计和计算
"""
from __future__ import annotations

from typing import Optional, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field


class CalculateInput(BaseModel):
    """计算参数"""
    expression: str = Field(description="数学表达式，如 'avg(85,90,78)' 或 'sum(10,20,30)'")


class StatisticsTool(BaseTool):
    """统计计算工具"""
    name: str = "calculate_statistics"
    description: str = """
    执行数据统计计算，支持:
    - sum(a,b,c,...) - 求和
    - avg(a,b,c,...) - 平均值
    - max(a,b,c,...) - 最大值
    - min(a,b,c,...) - 最小值
    - count(a,b,c,...) - 计数
    - rate(part,total) - 计算百分比
    """
    args_schema: Type[BaseModel] = CalculateInput

    def _run(self, expression: str) -> str:
        """执行计算"""
        try:
            # 解析并计算
            expr = expression.strip()

            if expr.startswith("sum(") and expr.endswith(")"):
                nums = [float(x.strip()) for x in expr[4:-1].split(",")]
                return f"总和: {sum(nums)}"

            elif expr.startswith("avg(") and expr.endswith(")"):
                nums = [float(x.strip()) for x in expr[4:-1].split(",")]
                return f"平均值: {sum(nums) / len(nums):.2f}"

            elif expr.startswith("max(") and expr.endswith(")"):
                nums = [float(x.strip()) for x in expr[4:-1].split(",")]
                return f"最大值: {max(nums)}"

            elif expr.startswith("min(") and expr.endswith(")"):
                nums = [float(x.strip()) for x in expr[4:-1].split(",")]
                return f"最小值: {min(nums)}"

            elif expr.startswith("count(") and expr.endswith(")"):
                items = [x.strip() for x in expr[6:-1].split(",")]
                return f"计数: {len(items)}"

            elif expr.startswith("rate(") and expr.endswith(")"):
                parts = [x.strip() for x in expr[5:-1].split(",")]
                part, total = float(parts[0]), float(parts[1])
                if total == 0:
                    return "分母不能为0"
                return f"比例: {part}/{total} = {part/total*100:.1f}%"

            else:
                # 尝试直接计算
                result = eval(expr, {"__builtins__": {}}, {})
                return f"计算结果: {result}"

        except Exception as e:
            return f"计算失败: {str(e)}"


# 导出工具实例
calculate_statistics = StatisticsTool()
