-- MySQL 数据库初始化
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS party_building
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

-- 注意：表结构由 SQLAlchemy 自动创建
-- 运行 python scripts/init_db.py 即可创建所有表
