"""
文档搜索工具 - LangChain Tool
用于智能体从党建文档库中检索相关内容
"""
from __future__ import annotations

from typing import Optional, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from app.rag.retriever import Retriever


class SearchDocumentsInput(BaseModel):
    """搜索参数"""
    query: str = Field(description="搜索关键词或问题")
    k: int = Field(default=5, description="返回结果数量")


class DocumentSearchTool(BaseTool):
    """文档搜索工具"""
    name: str = "search_documents"
    description: str = """
    从党建学习资料库中检索相关内容。
    输入应为搜索关键词或问题，返回相关的文档片段。
    可用于查找：党史知识、政策法规、理论文章、学习资料等。
    """
    args_schema: Type[BaseModel] = SearchDocumentsInput

    def _run(self, query: str, k: int = 5) -> str:
        """执行文档检索"""
        retriever = Retriever()
        results = retriever.similarity_search(query, k=k)

        if not results:
            return "未找到相关内容"

        output = []
        for i, doc in enumerate(results, 1):
            source = doc.metadata.get("source", "未知来源")
            output.append(f"[{i}] 来源: {source}")
            output.append(f"内容: {doc.page_content[:500]}...")
            output.append("---")

        return "\n".join(output)


# 导出工具实例
search_documents = DocumentSearchTool()
