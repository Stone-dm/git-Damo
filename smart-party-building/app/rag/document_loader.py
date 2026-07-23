"""
文档加载器
支持 PDF、Word、TXT、Markdown 等多种格式
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
)
from langchain_core.documents import Document


class DocumentLoader:
    """文档加载器"""

    SUPPORTED_EXTENSIONS = {
        ".pdf": PyPDFLoader,
        ".docx": Docx2txtLoader,
        ".doc": Docx2txtLoader,
        ".txt": TextLoader,
        ".md": UnstructuredMarkdownLoader,
    }

    def __init__(self, documents_dir: Optional[str] = None):
        self.documents_dir = documents_dir or ""

    def load_single(self, file_path: str) -> list[Document]:
        """
        加载单个文档

        Args:
            file_path: 文件路径

        Returns:
            文档对象列表

        Raises:
            ValueError: 不支持的文件格式
            FileNotFoundError: 文件不存在
        """
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")

        ext = path.suffix.lower()
        if ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(f"不支持的文件格式: {ext}，支持: {list(self.SUPPORTED_EXTENSIONS.keys())}")

        loader_class = self.SUPPORTED_EXTENSIONS[ext]
        loader = loader_class(str(path))
        documents = loader.load()

        # 添加元数据
        for doc in documents:
            doc.metadata.update({
                "source": str(path),
                "filename": path.name,
                "file_type": ext,
            })

        return documents

    def load_directory(self, directory: Optional[str] = None) -> list[Document]:
        """
        批量加载目录下所有支持的文档

        Args:
            directory: 目录路径，默认使用配置中的文档目录

        Returns:
            所有文档对象列表
        """
        target_dir = directory or self.documents_dir
        if not target_dir:
            raise ValueError("请指定文档目录")

        dir_path = Path(target_dir)
        if not dir_path.exists():
            raise FileNotFoundError(f"目录不存在: {target_dir}")

        all_documents = []
        for ext in self.SUPPORTED_EXTENSIONS:
            for file_path in dir_path.rglob(f"*{ext}"):
                try:
                    docs = self.load_single(str(file_path))
                    all_documents.extend(docs)
                    print(f"  ✓ 已加载: {file_path.name}")
                except Exception as e:
                    print(f"  ✗ 加载失败 {file_path.name}: {e}")

        print(f"\n共加载 {len(all_documents)} 个文档片段")
        return all_documents
