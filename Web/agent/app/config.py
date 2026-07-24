from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    milvus_host: str = "localhost"
    milvus_port: int = 19530

    embedding_dim: int = 1536
    embedding_api_key: str = ""
    embedding_base_url: str = ""
    embedding_model: str = "text-embedding-3-small"

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    # Optional shared secret; empty = open agent surface (dev). Backend sends X-Agent-Token.
    agent_shared_token: str = ""

    # Collection names (constants exposed via settings for convenience)
    kb_personal: str = "kb_personal"
    kb_learning: str = "kb_learning"


# Default dimension; runtime value comes from Settings.embedding_dim (env EMBEDDING_DIM).
EMBEDDING_DIM = 1536


@lru_cache
def get_settings() -> Settings:
    return Settings()
