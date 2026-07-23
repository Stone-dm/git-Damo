# 🏛️ 智慧党建智能体

基于 **LangChain + DeepSeek + FastAPI** 构建的智慧党建智能体系统，支持自然语言查询、个性化推荐和学习报告生成。

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🔍 **智能查询** | 用自然语言查询党建知识、政策文件、组织信息 |
| 🎯 **个性化推荐** | 根据党员画像推荐学习内容、课程、活动 |
| 📊 **学习报告** | 自动生成个人/支部/组织学习情况分析报告 |

## 🏗️ 项目结构

```
smart-party-building/
├── app/                    # 应用主目录
│   ├── api/               # API 路由层
│   ├── agents/            # LangChain 智能体
│   ├── rag/               # RAG 检索增强生成
│   ├── core/              # 核心配置与基础设施
│   ├── models/            # 数据模型
│   └── tools/             # 智能体工具函数
├── data/                  # 数据存储（本地生成，不提交到 Git）
│   ├── documents/         # 党建学习资料（放你的 PDF/Word 文件）
│   └── milvus_lite.db     # Milvus Lite 向量数据库（自动生成）
├── scripts/               # 工具脚本
├── tests/                 # 测试用例
├── docker-compose.yml     # Docker 编排（一键部署用）
└── .gitignore             # Git 忽略规则
```

## 👥 团队协作指引

本项目专为团队协作设计，请遵循以下流程：

### 首次加入项目

```bash
# 1. 克隆仓库
git clone <仓库地址>
cd smart-party-building

# 2. 创建 Conda 环境
conda create -n party-building python=3.11 -y
conda activate party-building

# 3. 安装依赖
pip install -r requirements.txt

# 4. 配置环境变量（复制后编辑 .env）
cp .env.example .env
# 填入你的 DeepSeek API Key 和 MySQL 密码

# 5. 初始化数据库（确保本地 MySQL 已运行）
python scripts/init_db.py
python scripts/seed_data.py

# 6. 导入测试文档（可选）
# 把党建学习资料放入 data/documents/ 后运行：
python scripts/ingest_docs.py

# 7. 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# 访问 http://localhost:8000/docs
```

### 日常开发流程

```bash
# 拉取最新代码
git pull

# 安装可能新增的依赖
pip install -r requirements.txt

# 如果有数据库表变更，重新初始化
python scripts/init_db.py

# 启动开发
uvicorn app.main:app --reload
```

### ⚠️ Git 提交注意事项

| 文件/目录 | 是否提交 | 说明 |
|-----------|---------|------|
| `app/` `scripts/` `tests/` | ✅ 提交 | 核心代码，全部入仓 |
| `.env.example` `docker-compose.yml` | ✅ 提交 | 配置文件模板 |
| `requirements.txt` `pyproject.toml` | ✅ 提交 | 依赖清单 |
| `.env` | ❌ 忽略 | 每人本地配置，含密码和 API Key |
| `data/milvus_lite.db` | ❌ 忽略 | 每人本地生成自己的向量库 |
| `data/documents/*.pdf` | ❌ 忽略 | 测试文档各放各的 |
| `__pycache__/` `logs/` | ❌ 忽略 | 编译缓存和日志 |

### 依赖变更

```bash
# 如果你新增了依赖：
pip install <包名>
pip freeze > requirements.txt
# 然后提交 requirements.txt
```
