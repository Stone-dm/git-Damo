"""
智慧党建智能体 - FastAPI 主入口
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

# 在导入任何 huggingface 相关库之前设置镜像
os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.query import router as query_router
from app.api.recommend import router as recommend_router
from app.api.report import router as report_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # ---- 启动时 ----
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 启动中...")
    print(f"📊 LLM 模型: {settings.LLM_MODEL}")
    print(f"🔤 嵌入模型: {settings.EMBEDDING_MODEL}")
    print(f"🗄️  数据库: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")

    # 确保必要目录存在
    Path(settings.DOCUMENTS_DIR).mkdir(parents=True, exist_ok=True)

    yield

    # ---- 关闭时 ----
    print(f"👋 {settings.APP_NAME} 已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="基于 LangChain + DeepSeek 的智慧党建智能体系统",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---- 中间件 ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- 注册路由 ----
app.include_router(health_router)
app.include_router(query_router)
app.include_router(recommend_router)
app.include_router(report_router)

# ---- 托管前端页面 ----
import os
_frontend_path = Path(__file__).parent.parent / "frontend"
if _frontend_path.exists():
    app.mount("/ui", StaticFiles(directory=str(_frontend_path), html=True), name="frontend")


# ---- 根路径 ----
@app.get("/", tags=["系统"])
async def root():
    """欢迎页面"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": {
            "query": "POST /api/v1/query - 自然语言查询",
            "chat": "POST /api/v1/chat - 多轮对话",
            "recommend": "POST /api/v1/recommend - 个性化推荐",
            "report": "POST /api/v1/report/generate - 学习报告生成",
        },
    }
