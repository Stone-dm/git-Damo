"""
检索器封装
使用 Milvus 提供多种检索策略：基础相似度检索、MMR、带过滤检索
"""
from __future__ import annotations

from typing import Optional

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.retrievers import BaseRetriever
from langchain_milvus import Milvus

from app.core.config import settings
from app.core.embedding import get_embedding_model


def _get_milvus_connection_args() -> dict:
    """获取 Milvus 连接参数"""
    if settings.MILVUS_USE_LITE:
        return {"uri": "./data/milvus_lite.db"}
    else:
        return {
            "host": settings.MILVUS_HOST,
            "port": settings.MILVUS_PORT,
        }


class Retriever:
    """检索器"""

    def __init__(
        self,
        embedding_model: Optional[Embeddings] = None,
        collection_name: Optional[str] = None,
    ):
        """
        初始化检索器

        Args:
            embedding_model: 嵌入模型
            collection_name: 集合名称，默认从 settings 读取
        """
        self.embedding_model = embedding_model or get_embedding_model()
        self.collection_name = collection_name or settings.MILVUS_COLLECTION_NAME
        self.connection_args = _get_milvus_connection_args()

    def _get_vector_store(self) -> Milvus:
        """获取向量存储实例"""
        return Milvus(
            collection_name=self.collection_name,
            embedding_function=self.embedding_model,
            connection_args=self.connection_args,
            auto_id=True,
        )

    def similarity_search(
        self,
        query: str,
        k: int = 5,
        score_threshold: Optional[float] = None,
    ) -> list[Document]:
        """
        相似度检索

        Args:
            query: 查询文本
            k: 返回结果数
            score_threshold: 相似度阈值

        Returns:
            相关文档列表
        """
        vector_store = self._get_vector_store()
        return vector_store.similarity_search(
            query,
            k=k,
        )

    def mmr_search(
        self,
        query: str,
        k: int = 5,
        fetch_k: int = 20,
        lambda_mult: float = 0.5,
    ) -> list[Document]:
        """
        MMR 最大边际相关性检索
        平衡相关性与多样性

        Args:
            query: 查询文本
            k: 返回结果数
            fetch_k: 初始获取数
            lambda_mult: 多样性参数（0-1, 越大越相关）

        Returns:
            多样化后的文档列表
        """
        vector_store = self._get_vector_store()
        return vector_store.max_marginal_relevance_search(
            query,
            k=k,
            fetch_k=fetch_k,
            lambda_mult=lambda_mult,
        )

    def as_langchain_retriever(self, k: int = 5) -> BaseRetriever:
        """
        获取 LangChain 检索器对象
        用于集成到 LangChain 链中

        Args:
            k: 返回结果数

        Returns:
            LangChain BaseRetriever 实例
        """
        vector_store = self._get_vector_store()
        return vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k},
        )
