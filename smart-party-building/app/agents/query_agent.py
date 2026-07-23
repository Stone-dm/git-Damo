"""
智能查询智能体
基于 LangChain Agent + RAG 实现自然语言查询
支持：党建知识查询、政策文件检索、组织信息查询
"""
from __future__ import annotations

import time
from typing import Any, Optional

from langchain.agents import create_agent
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.core.llm import get_chat_model
from app.rag.retriever import Retriever
from app.tools.sql_tool import query_database
from app.tools.search_tool import search_documents

# ---- 系统提示词 ----
SYSTEM_PROMPT = """你是一位专业的智慧党建智能助手，擅长回答党建相关问题。

## 核心能力
1. **党建知识问答**：解答党史、党章、政策法规等问题
2. **政策文件检索**：从党建学习资料中查找相关内容
3. **组织信息查询**：查询党组织架构、党员信息等
4. **学习建议**：根据党员情况提供学习建议

## 回答要求
- 回答要准确、权威，引用来源
- 对于不确定的内容，要说明"根据现有资料..."
- 涉及政策解读时，要注明出处和文件名称
- 回答风格应正式、严谨，体现党建工作的严肃性

## 可用工具
你可以在需要时使用以下工具来获取信息：
1. search_documents - 从党建文档库中检索相关内容
2. query_database - 查询数据库中的组织和党员信息
"""


class QueryAgent:
    """查询智能体"""

    def __init__(self):
        self.llm = get_chat_model(temperature=0.3)
        self.retriever = Retriever()
        self.agent = self._build_agent()

    def _build_agent(self):
        """
        构建 LangChain Agent（新版 API）

        Returns:
            CompiledStateGraph 实例
        """
        tools = [
            search_documents,
            query_database,
        ]

        return create_agent(
            model=self.llm,
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            debug=False,
        )

    async def query(
        self,
        question: str,
        member_id: Optional[int] = None,
        history: Optional[list[dict[str, str]]] = None,
    ) -> dict[str, Any]:
        """
        执行查询

        Args:
            question: 用户问题
            member_id: 党员ID（用于个性化）
            history: 对话历史

        Returns:
            {
                "answer": str,
                "sources": list[dict],
                "processing_time": float
            }
        """
        start_time = time.time()
        chat_history = self._format_history(history) if history else []

        # 新版 LangChain API：通过 messages 列表传参
        messages = chat_history + [HumanMessage(content=question)]
        result = await self.agent.ainvoke({"messages": messages})

        processing_time = time.time() - start_time

        # 从返回的 messages 中提取 AI 回答
        answer = ""
        sources = []
        for msg in result.get("messages", []):
            if isinstance(msg, AIMessage) and msg.content:
                answer = msg.content
            # 收集工具调用来源
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc.get("name") == "search_documents":
                        sources.append({
                            "tool": tc["name"],
                            "query": tc.get("args", {}).get("query", ""),
                            "result_preview": "",
                        })

        return {
            "answer": answer,
            "sources": sources,
            "processing_time": round(processing_time, 2),
        }

    def _format_history(self, history: list[dict[str, str]]) -> list:
        """格式化对话历史"""
        from langchain_core.messages import AIMessage, HumanMessage

        formatted = []
        for msg in history:
            if msg.get("role") == "user":
                formatted.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                formatted.append(AIMessage(content=msg.get("content", "")))
        return formatted

    def _extract_sources(self, result: dict) -> list[dict]:
        """从结果中提取来源信息"""
        sources = []
        for msg in result.get("messages", []):
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc.get("name") == "search_documents":
                        sources.append({
                            "tool": tc["name"],
                            "query": tc.get("args", {}).get("query", ""),
                            "result_preview": "",
                        })
        return sources
