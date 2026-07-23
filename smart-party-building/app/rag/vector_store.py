"""
向量数据库管理
使用 Milvus 向量数据库（支持 Milvus Lite 本地嵌入和独立服务）
"""
from __future__ import annotations

from typing import Optional

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_milvus import Milvus

from app.core.config import settings
from app.core.embedding import get_embedding_model


def _get_milvus_connection_args() -> dict:
    """
    获取 Milvus 连接参数

    Returns:
        连接配置字典
    """
    if settings.MILVUS_USE_LITE:
        # Milvus Lite: 本地嵌入式，无需额外配置
        return {"uri": "./data/milvus_lite.db"}
    else:
        # Milvus 独立服务
        return {
            "host": settings.MILVUS_HOST,
            "port": settings.MILVUS_PORT,
        }


class VectorStoreManager:
    """向量数据库管理器"""

    def __init__(
        self,
        embedding_model: Optional[Embeddings] = None,
        collection_name: Optional[str] = None,
    ):
        """
        初始化向量数据库管理器

        Args:
            embedding_model: 嵌入模型，默认使用全局嵌入模型
            collection_name: 集合名称，默认从 settings 读取
        """
        self.embedding_model = embedding_model or get_embedding_model()
        self.collection_name = collection_name or settings.MILVUS_COLLECTION_NAME
        self.connection_args = _get_milvus_connection_args()

    def _get_vector_store(self) -> Milvus:
        """
        获取 Milvus 向量存储实例

        Returns:
            Milvus 向量存储
        """
        return Milvus(
            collection_name=self.collection_name,
            embedding_function=self.embedding_model,
            connection_args=self.connection_args,
            auto_id=True,
        )

    def add_documents(self, documents: list[Document]) -> list[str]:
        """
        向向量数据库添加文档

        Args:
            documents: 文档列表

        Returns:
            文档 ID 列表
        """
        vector_store = self._get_vector_store()
        return vector_store.add_documents(documents)

    def similarity_search(
        self,
        query: str,
        k: int = 5,
        filter: Optional[dict] = None,
    ) -> list[Document]:
        """
        相似度搜索

        Args:
            query: 查询文本
            k: 返回结果数量
            filter: 元数据过滤条件（Milvus 表达式格式）

        Returns:
            相似文档列表
        """
        vector_store = self._get_vector_store()
        return vector_store.similarity_search(query, k=k, filter=filter)

    def delete_collection(self) -> None:
        """删除集合"""
        vector_store = self._get_vector_store()
        vector_store.collection.drop()

    def get_collection_stats(self) -> dict:
        """获取集合统计信息"""
        vector_store = self._get_vector_store()
        collection = vector_store.collection
        collection.flush()
        return {
            "collection_name": self.collection_name,
            "count": collection.num_entities,
        }
