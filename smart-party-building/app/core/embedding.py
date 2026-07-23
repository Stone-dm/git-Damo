"""
文本嵌入模型封装
使用 sentence-transformers 加载本地中文嵌入模型
"""
from __future__ import annotations

import os

# 设置 HuggingFace 镜像（在导入 huggingface 相关库之前设置）
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

from functools import lru_cache
from typing import Optional

from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings

from app.core.config import settings


@lru_cache(maxsize=1)
def get_embedding_model(
    model_name: Optional[str] = None,
    device: str = "cpu",
) -> Embeddings:
    """
    获取文本嵌入模型（单例缓存）

    Args:
        model_name: 模型名称，默认从 settings 读取
        device: 运行设备 cpu/cuda

    Returns:
        HuggingFaceEmbeddings 实例
    """
    model_name = model_name or settings.EMBEDDING_MODEL

    return HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs={"device": device},
        encode_kwargs={
            "normalize_embeddings": True,
            "show_progress_bar": False,
        },
    )
