#!/usr/bin/env python
"""
数据库初始化脚本
创建数据库表结构
"""
from __future__ import annotations

import sys
from pathlib import Path

# 将项目根目录加入 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.database import sync_engine
from app.models.database import Base


def main():
    """初始化数据库"""
    print(f"🗄️  正在初始化数据库...")
    print(f"  数据库: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    print()

    # 创建所有表
    print("📦 创建数据库表...")
    Base.metadata.create_all(bind=sync_engine)

    # 列出创建的表
    tables = Base.metadata.tables.keys()
    print(f"✅ 成功创建 {len(tables)} 个表:")
    for table_name in tables:
        print(f"  - {table_name}")

    print()
    print("🎉 数据库初始化完成！")
    print(f"💡 运行 python scripts/seed_data.py 导入测试数据")


if __name__ == "__main__":
    main()
