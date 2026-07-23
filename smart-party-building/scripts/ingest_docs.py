#!/usr/bin/env python
"""
文档导入脚本
将 data/documents/ 目录下的党建学习资料导入向量数据库
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.rag.document_loader import DocumentLoader
from app.rag.text_splitter import TextSplitter
from app.rag.vector_store import VectorStoreManager


def main():
    """导入文档到向量数据库"""
    print("📄 智慧党建 - 文档导入工具\n")

    # 检查文档目录
    docs_dir = Path(settings.DOCUMENTS_DIR)
    if not docs_dir.exists():
        docs_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 已创建文档目录: {docs_dir}")
        print("📌 请将 PDF、Word、TXT 等学习资料放入该目录后重新运行")
        return

    # 检查是否有文件
    supported_extensions = [".pdf", ".docx", ".doc", ".txt", ".md"]
    files = []
    for ext in supported_extensions:
        files.extend(docs_dir.glob(f"*{ext}"))

    if not files:
        print(f"📌 文档目录 {docs_dir} 中没有找到支持的文档")
        print(f"   支持的格式: {', '.join(supported_extensions)}")
        print("   请将党建学习资料放入该目录后重新运行")
        return

    print(f"📁 文档目录: {docs_dir}")
    print(f"📦 发现 {len(files)} 个文件\n")

    # 1. 加载文档
    print("⏳ 步骤 1/3: 加载文档...")
    loader = DocumentLoader(documents_dir=str(docs_dir))
    documents = loader.load_directory()
    print(f"   ✅ 共加载 {len(documents)} 个文档片段\n")

    if not documents:
        print("❌ 没有成功加载任何文档，请检查文件格式")
        return

    # 2. 文本分块
    print("⏳ 步骤 2/3: 文本分块...")
    splitter = TextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = splitter.split_documents(documents)
    print(f"   ✅ 共生成 {len(chunks)} 个文本块\n")

    # 3. 导入向量数据库
    print("⏳ 步骤 3/3: 导入向量数据库...")
    vector_store = VectorStoreManager()
    doc_ids = vector_store.add_documents(chunks)
    print(f"   ✅ 成功导入 {len(doc_ids)} 个向量\n")

    # 4. 验证
    stats = vector_store.get_collection_stats()
    print(f"📊 向量数据库状态:")
    print(f"   集合名称: {stats['collection_name']}")
    print(f"   向量数量: {stats['count']}")

    print("\n🎉 文档导入完成！现在可以通过 API 进行查询了。")


if __name__ == "__main__":
    main()
