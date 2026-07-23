"""
数据库连接管理
支持同步 (SQLAlchemy) 和异步 (aiomysql) 两种模式
"""
from __future__ import annotations

from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# ---- 同步引擎 ----
sync_engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)

# ---- 异步引擎 ----
async_engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    expire_on_commit=False,
)


class DatabaseSession:
    """数据库会话上下文管理器"""

    @contextmanager
    def get_sync_session(self) -> Generator[Session, None, None]:
        """获取同步数据库会话"""
        session = SyncSessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """获取异步数据库会话"""
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


# 便捷函数
def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖注入：同步数据库会话"""
    db = DatabaseSession()
    with db.get_sync_session() as session:
        yield session


async def init_db() -> None:
    """初始化数据库（创建所有表）"""
    from app.models.database import Base

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
