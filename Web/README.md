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

### Agent API（Backend 转发契约）

| 方法 | 路径 | 关键请求字段（snake_case） |
|------|------|---------------------------|
| POST | `/ingest` | `document_id`, `kb_type`(`PERSONAL`/`LEARNING`), `text`, `user_id`, `branch_id` |
| POST | `/recommend` | `user_id`, `branch_id`, `query`（空则默认「推荐学习」） |
| POST | `/chat` | `user_id`, `branch_id`, `role`, `message`, `document_id?`, `text?`, `history?` |

Backend `AgentClient` / `AgentPayloads` 会把 `null` 的 `branch_id`/`user_id` 规范成 `""`，避免 FastAPI 422。

## Backend ↔ Agent 联调

### 1. 启动依赖

```bash
cd Web
cp .env.example .env   # 如尚未复制
docker compose up -d
# 等待 MySQL healthy、Milvus 可连
docker compose ps
```

### 2. 启动 Agent（端口 8000）

```bash
cd Web/agent
.venv\Scripts\activate   # Windows
uvicorn app.main:app --reload --port 8000
# 另开终端冒烟：
curl http://localhost:8000/health
curl -X POST http://localhost:8000/recommend -H "Content-Type: application/json" -d "{\"user_id\":\"3\",\"branch_id\":\"1\",\"query\":\"推荐学习\"}"
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d "{\"user_id\":\"3\",\"branch_id\":\"1\",\"role\":\"MEMBER\",\"message\":\"帮我总结要点\",\"text\":\"测试文档内容\"}"
```

### 3. 启动 Backend（端口 8080）

```bash
cd Web/backend
# 默认 app.agent.base-url=http://localhost:8000（可用 AGENT_BASE_URL 覆盖）
mvn spring-boot:run
```

### 4. 业务链路（member）

```bash
# 登录
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"member\",\"password\":\"mem123\"}"
# 将返回的 data.token 设为 TOKEN

# 上传 LEARNING → 期望 syncStatus=SYNCED（Agent/Milvus 可用时）
curl -s -X POST http://localhost:8080/api/knowledge/upload -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"联调材料\",\"kbType\":\"LEARNING\",\"content\":\"党的二十大报告学习要点……\",\"sourceName\":\"demo.txt\"}"

# 推荐 / 对话 → 期望非空 items / reply（无 Key 时为降级文案）
curl -s -X POST http://localhost:8080/api/agent/recommend -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"query\":\"推荐学习\"}"
curl -s -X POST http://localhost:8080/api/agent/chat -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"message\":\"帮我总结要点\",\"text\":\"坚持党的全面领导，推进高质量发展。\"}"
```

### 5. 可选：自动化联调 IT

MySQL + Agent 均已启动时：

```bash
cd Web/backend
# Windows PowerShell:
$env:AGENT_IT="true"; mvn -q test "-Dtest=AgentIntegrationIT"
```

未设置 `AGENT_IT=true` 时该测试跳过。日常用 H2 + 字段契约单测即可：

```bash
mvn -q test "-Dtest=AgentPayloadSerializationTest,KnowledgeControllerTest"
cd ../agent
.venv\Scripts\python.exe -m pytest tests/test_ingest_recommend.py -v
```
