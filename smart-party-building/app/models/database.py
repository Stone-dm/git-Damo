"""
SQLAlchemy 数据库模型定义
"""
from __future__ import annotations

import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, JSON, Date
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """声明性基类"""
    pass


class Organization(Base):
    """党组织机构"""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, comment="组织名称")
    parent_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, comment="上级组织ID")
    level = Column(String(50), nullable=False, comment="组织层级: 党委/党总支/党支部")
    description = Column(Text, nullable=True, comment="组织描述")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # 关系
    parent = relationship("Organization", remote_side=[id], backref="children")
    members = relationship("PartyMember", back_populates="organization")


class PartyMember(Base):
    """党员信息"""
    __tablename__ = "party_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="姓名")
    gender = Column(String(10), nullable=True, comment="性别")
    birth_date = Column(Date, nullable=True, comment="出生日期")
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, comment="所属组织ID")
    position = Column(String(200), nullable=True, comment="党内职务")
    join_date = Column(Date, nullable=True, comment="入党日期")
    education = Column(String(50), nullable=True, comment="学历")
    phone = Column(String(20), nullable=True, comment="联系电话")
    profile_tags = Column(JSON, nullable=True, comment="党员画像标签")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # 关系
    organization = relationship("Organization", back_populates="members")
    learning_records = relationship("LearningRecord", back_populates="member")


class Course(Base):
    """学习课程/内容"""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False, comment="课程标题")
    description = Column(Text, nullable=True, comment="课程描述")
    content_type = Column(String(50), nullable=False, comment="内容类型: article/video/quiz")
    category = Column(String(100), nullable=True, comment="分类: 党史/政策/理论/法规")
    tags = Column(JSON, nullable=True, comment="标签列表")
    difficulty = Column(String(20), nullable=True, comment="难度: beginner/intermediate/advanced")
    duration_minutes = Column(Integer, nullable=True, comment="预计学习时长(分钟)")
    content_url = Column(String(500), nullable=True, comment="内容链接")
    is_required = Column(Integer, default=0, comment="是否必修: 0-选修 1-必修")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # 关系
    learning_records = relationship("LearningRecord", back_populates="course")


class LearningRecord(Base):
    """学习记录"""
    __tablename__ = "learning_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("party_members.id"), nullable=False, comment="党员ID")
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, comment="课程ID")
    start_time = Column(DateTime, nullable=True, comment="开始学习时间")
    end_time = Column(DateTime, nullable=True, comment="完成时间")
    duration_minutes = Column(Integer, default=0, comment="学习时长(分钟)")
    progress = Column(Float, default=0.0, comment="学习进度 0-100")
    test_score = Column(Float, nullable=True, comment="测试成绩")
    status = Column(String(20), default="in_progress", comment="状态: not_started/in_progress/completed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # 关系
    member = relationship("PartyMember", back_populates="learning_records")
    course = relationship("Course", back_populates="learning_records")


class Document(Base):
    """党建文档资料"""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False, comment="文档标题")
    file_type = Column(String(20), nullable=True, comment="文件类型: pdf/docx/txt")
    file_path = Column(String(500), nullable=True, comment="文件路径")
    category = Column(String(100), nullable=True, comment="分类")
    summary = Column(Text, nullable=True, comment="文档摘要")
    metadata_info = Column(JSON, nullable=True, comment="额外元数据")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # 关系
    chunks = relationship("DocumentChunk", back_populates="document")


class DocumentChunk(Base):
    """文档分块（向量化后的文本块）"""
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, comment="所属文档ID")
    chunk_index = Column(Integer, nullable=False, comment="分块序号")
    content = Column(Text, nullable=False, comment="文本内容")
    metadata_info = Column(JSON, nullable=True, comment="块级元数据")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # 关系
    document = relationship("Document", back_populates="chunks")
