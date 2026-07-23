"""
应用配置模块
使用 pydantic-settings 从环境变量加载配置
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用全局配置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- 应用信息 ----
    APP_NAME: str = "智慧党建智能体"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # ---- DeepSeek LLM 配置 ----
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_API_BASE: str = "https://api.deepseek.com"
    LLM_MODEL: str = "deepseek-chat"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 4096

    # ---- 嵌入模型配置 ----
    EMBEDDING_MODEL: str = "BAAI/bge-large-zh-v1.5"
    EMBEDDING_DIMENSION: int = 1024

    # ---- MySQL 数据库 ----
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "party_building"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    @property
    def DATABASE_URL(self) -> str:
        """同步数据库连接 URL"""
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """异步数据库连接 URL"""
        return (
            f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    # ---- Milvus 向量数据库 ----
    VECTOR_STORE_TYPE: str = "milvus"
    MILVUS_HOST: str = "localhost"
    MILVUS_PORT: int = 19530
    MILVUS_ALIAS: str = "default"
    MILVUS_COLLECTION_NAME: str = "party_building_docs"
    MILVUS_USE_LITE: bool = True  # 开发环境使用 Milvus Lite（无需独立服务）

    # ---- Redis ----
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # ---- CORS ----
    CORS_ORIGINS: str = "*"

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [self.CORS_ORIGINS] if self.CORS_ORIGINS == "*" else [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ---- 路径配置 ----
    DATA_DIR: str = str(Path(__file__).parent.parent.parent / "data")
    DOCUMENTS_DIR: str = str(Path(__file__).parent.parent.parent / "data" / "documents")


# 全局单例
settings = Settings()

# 自动从环境变量加载 .env 文件
_env_path = Path(__file__).parent.parent.parent / ".env"
if _env_path.exists():
    settings = Settings(_env_file=str(_env_path))
