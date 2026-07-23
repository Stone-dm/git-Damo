"""
LLM 模型封装
支持 DeepSeek API 和 OpenAI 兼容接口
"""
from __future__ import annotations

from typing import Optional

from langchain_core.language_models import BaseLanguageModel
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_deepseek import ChatDeepSeek

from app.core.config import settings


def get_chat_model(
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    streaming: bool = False,
) -> BaseChatModel:
    """
    获取 DeepSeek 聊天模型实例

    Args:
        model: 模型名称，默认从 settings 读取
        temperature: 温度参数，控制生成随机性
        max_tokens: 最大 Token 数
        streaming: 是否启用流式输出

    Returns:
        ChatDeepSeek 实例
    """
    return ChatDeepSeek(
        model=model or settings.LLM_MODEL,
        temperature=temperature or settings.LLM_TEMPERATURE,
        max_tokens=max_tokens or settings.LLM_MAX_TOKENS,
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_API_BASE,
        streaming=streaming,
    )


def get_llm(**kwargs) -> BaseLanguageModel:
    """获取 LLM 实例（别名，兼容 LangChain 接口）"""
    return get_chat_model(**kwargs)
