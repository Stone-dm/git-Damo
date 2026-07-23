"""
查询智能体测试
"""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_query_agent_initialization():
    """测试查询智能体初始化"""
    from app.agents.query_agent import QueryAgent

    agent = QueryAgent()
    assert agent is not None
    assert agent.agent_executor is not None


@pytest.mark.asyncio
async def test_retriever_initialization():
    """测试检索器初始化"""
    from app.rag.retriever import Retriever

    retriever = Retriever()
    assert retriever is not None


def test_text_splitter():
    """测试文本分块器"""
    from app.rag.text_splitter import TextSplitter

    splitter = TextSplitter(chunk_size=100, chunk_overlap=20)
    from langchain_core.documents import Document

    docs = [Document(page_content="习近平新时代中国特色社会主义思想是马克思主义中国化的最新成果。" * 10)]
    chunks = splitter.split_documents(docs)
    assert len(chunks) > 0
    assert all(hasattr(c, "page_content") for c in chunks)
