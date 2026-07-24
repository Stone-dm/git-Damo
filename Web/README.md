# Party School Web

党校学习系统 Web 端脚手架（Spring Boot + LangChain Agent + React + Expo）。

## 基础设施

本地开发依赖 MySQL（业务库）与 Milvus（向量库），通过 Docker Compose 一键启动。

### 启动

```bash
cd Web
cp .env.example .env   # 按需填写 DEEPSEEK_API_KEY 等密钥
docker compose up -d
docker compose ps
```

首次拉取镜像可能需要数分钟。启动后应看到 `mysql`、`milvus`、`etcd`、`minio` 均为 `running`（MySQL 在 healthcheck 通过后会显示 `healthy`）。

### 等待 MySQL 就绪

MySQL 配置了 healthcheck，可通过以下命令等待其变为 healthy 后再启动后端：

```bash
docker compose ps mysql
# 或持续等待
docker compose exec mysql mysqladmin ping -h localhost
```

当 `docker compose ps` 中 MySQL 状态为 `healthy` 时，即可连接数据库。

### 服务端口

| 服务 | 地址 | 说明 |
|------|------|------|
| MySQL | `localhost:3306` | 库名 `party_school` |
| Milvus | `localhost:19530` | 向量检索 |
| MinIO Console | `localhost:9001` | Milvus 对象存储（内部依赖） |

### 默认账号密码

**Docker / 数据库**

| 用途 | 用户名 | 密码 | 备注 |
|------|--------|------|------|
| MySQL root | `root` | `root` | 容器内管理员 |
| MySQL 应用用户 | `party` | `party123` | 连接库 `party_school`，见 `.env.example` |
| MinIO | `minioadmin` | `minioadmin` | Milvus 依赖，一般无需直接使用 |

**应用演示账号**（由后续 `DataSeeder` 在空库时自动插入，同一演示支部）

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 支部书记 | `secretary` | `sec123` |
| 普通党员 | `member` | `mem123` |

### 停止与清理

```bash
docker compose down        # 停止容器，保留数据卷
docker compose down -v     # 停止并删除数据卷（清空数据库）
```

### 环境变量

复制 `.env.example` 为 `.env` 并填写密钥。**切勿将 `.env` 提交到 Git**；DeepSeek 等 API Key 仅通过环境变量注入。

## Agent（FastAPI）

```bash
cd Web/agent
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
pytest tests/test_health.py -v
uvicorn app.main:app --reload --port 8000
```

- Health: `GET http://localhost:8000/health` → `{"status":"ok"}`
- 启动时会尝试 `ensure_collections`（`kb_personal` / `kb_learning`）；Milvus 不可达时仅打日志，不影响 `/health`
- `EMBEDDING_DIM` 默认 `1536`（见 `.env.example`）；无 `EMBEDDING_API_KEY` 时使用确定性伪向量（仅用于打通链路）
