"""
文本分块器
支持多种分块策略，针对中文党建文档优化
"""
from __future__ import annotations

from typing import Optional

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


class TextSplitter:
    """文本分块器"""

    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 100,
        separators: Optional[list[str]] = None,
    ):
        """
        初始化分块器

        Args:
            chunk_size: 每块最大字符数
            chunk_overlap: 块间重叠字符数
            separators: 分隔符优先级列表，默认按中文文档结构优化
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # 针对中文党建文档优化的分隔符
        self.separators = separators or [
            "\n\n",           # 段落分隔
            "\n",             # 行分隔
            "。",             # 句号
            "！",             # 感叹号
            "？",             # 问号
            "；",             # 分号
            "，",             # 逗号
            " ",              # 空格
            "",               # 字符级回退
        ]

        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=self.separators,
            length_function=len,
            keep_separator=True,
        )

    def split_documents(self, documents: list[Document]) -> list[Document]:
        """
        对文档列表进行分块

        Args:
            documents: 原始文档列表

        Returns:
            分块后的文档列表，每块包含原始元数据 + 块索引
        """
        chunks = self._splitter.split_documents(documents)

        # 添加块索引元数据
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = i

        return chunks

    def split_text(self, text: str, metadata: Optional[dict] = None) -> list[Document]:
        """
        直接对文本进行分块

        Args:
            text: 原始文本
            metadata: 元数据

        Returns:
            分块后的文档列表
        """
        if metadata is None:
            metadata = {}

        return self._splitter.create_documents([text], metadatas=[metadata])
