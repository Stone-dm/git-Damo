# Party School Web

党校学习系统脚手架：**MySQL + Milvus（Docker）→ Agent（FastAPI）→ Backend（Spring Boot）→ Frontend（React）/ Mobile（Expo）**。

## 完整启动顺序

按下列顺序启动。前后端与 Agent 依赖基础设施；前端/移动端依赖 Backend `:8080`。

### 1. Docker Compose（MySQL + Milvus）

```bash
cd Web
cp .env.example .env   # 按需填写 DEEPSEEK_API_KEY 等（见下文）
docker compose up -d
docker compose ps
```

首次拉取镜像可能需要数分钟。就绪后应看到 `mysql`、`milvus`、`etcd`、`minio` 均为 `running`（MySQL healthcheck 通过后为 `healthy`）。

```bash
docker compose ps mysql
docker compose exec mysql mysqladmin ping -h localhost
```

| 服务 | 地址 | 说明 |
|------|------|------|
| MySQL | `localhost:3306` | 库名 `party_school` |
| Milvus | `localhost:19530` | 向量检索 |
| MinIO Console | `localhost:9001` | Milvus 对象存储（内部依赖） |

停止：

```bash
docker compose down        # 保留数据卷
docker compose down -v     # 清空数据卷
```

### 2. Agent（venv + uvicorn，端口 8000）

```bash
cd Web/agent
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

冒烟：

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

- 启动时尝试 `ensure_collections`（`kb_personal` / `kb_learning`）；Milvus 不可达时仅打日志，不影响 `/health`
- `EMBEDDING_DIM` 默认 `1536`（见 `.env.example`）；无 `EMBEDDING_API_KEY` 时使用确定性伪向量（仅用于打通链路）
- 无 `DEEPSEEK_API_KEY` 时推荐/助手走**降级文案**（链路仍可通）

### 3. Backend（Maven Spring Boot，端口 8080）

```bash
cd Web/backend
# 默认 app.agent.base-url=http://localhost:8000（可用 AGENT_BASE_URL 覆盖）
mvn spring-boot:run
```

空库首次启动时 `DataSeeder` 会写入演示支部与种子账号。健康检查：`GET http://localhost:8080/actuator/health`（若已暴露）。

### 4. Frontend（Vite React，端口 5173）

```bash
cd Web/frontend
npm install
# 可选：复制/确认 .env 中 VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

浏览器打开 `http://localhost:5173/`，使用下方种子账号登录。

### 5. Mobile（Expo + API Base URL）

```bash
cd Web/mobile
npm install
# 创建 .env（或启动前导出）：
# EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8080
npx expo start
```

**API Base URL 说明：**

| 场景 | `EXPO_PUBLIC_API_BASE_URL` |
|------|------------------------------|
| 本机 / iOS 模拟器 | `http://localhost:8080` |
| Android 模拟器 | `http://10.0.2.2:8080` |
| **真机 Expo Go** | 电脑**局域网 IP**，如 `http://192.168.1.23:8080`（不能写 `localhost`） |

修改 `.env` 后需重启 `npx expo start`。用 Expo Go 扫码，或按 `a` / `i` 打开模拟器。党员主路径：登录 → 学习 / 推荐 / 助手 / 我的。管理功能请使用 Web。

---

## 种子账号

**Docker / 数据库**

| 用途 | 用户名 | 密码 | 备注 |
|------|--------|------|------|
| MySQL root | `root` | `root` | 容器内管理员 |
| MySQL 应用用户 | `party` | `party123` | 库 `party_school`，见 `.env.example` |
| MinIO | `minioadmin` | `minioadmin` | Milvus 依赖，一般无需直接使用 |

**应用演示账号**（Backend 空库时由 `DataSeeder` 自动插入，同一演示支部）

| 角色 | 用户名 | 密码 | Web 侧栏要点 |
|------|--------|------|----------------|
| 管理员 | `admin` | `admin123` | 含用户管理、支部管理等全部菜单 |
| 支部书记 | `secretary` | `sec123` | 有用户管理；无支部管理 |
| 普通党员 | `member` | `mem123` | 学习 / 考试占位 / 知识库 / 推荐 / 助手 |

登录页亦提示上述三组账号。

---

## DeepSeek Key 配置

1. 复制 `Web/.env.example` → `Web/.env`（以及 Agent 进程能读到的环境变量；**切勿提交 `.env`**）。
2. 填写：

```env
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

3. **必须重启 Agent（uvicorn）** 后 Key 才会生效；Backend 通过 `AGENT_BASE_URL` 转发，本身不直接调 DeepSeek。
4. Key 为空时：`/recommend`、`/chat` 仍返回可用结果，但为**降级文案**（见 Agent 日志 `DEEPSEEK_API_KEY empty`）。
5. 可选：`EMBEDDING_API_KEY` / `EMBEDDING_*` 用于真实向量；未配置时用伪向量，便于本地打通 MySQL + Milvus 入库链路。

---

## 端到端验收清单（按 README 冷启动）

| # | 项 | 期望 |
|---|----|------|
| 1 | 三角色 Web 登录与权限菜单 | `admin` / `secretary` / `member` 可登录；菜单与上表一致 |
| 2 | 知识入库 MySQL + Milvus | 党员上传 LEARNING 知识 → `syncStatus=SYNCED`（Agent/Milvus 可用时） |
| 3 | Web / Mobile 推荐 | `/recommend` 或页面有非空 items（无 Key 可为降级） |
| 4 | Web / Mobile 助手总结 | `/chat` 或助手页有 reply（无 Key 可为降级） |
| 5 | 考试页占位可达 | Web「考试管理」列表可打开；Mobile 不要求完整考试流 |

### Backend ↔ Agent 联调（curl）

```bash
# 登录
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"member\",\"password\":\"mem123\"}"
# 将返回的 data.token 设为 TOKEN

curl -s -X POST http://localhost:8080/api/knowledge/upload -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"联调材料\",\"kbType\":\"LEARNING\",\"content\":\"党的二十大报告学习要点……\",\"sourceName\":\"demo.txt\"}"

curl -s -X POST http://localhost:8080/api/agent/recommend -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"query\":\"推荐学习\"}"

curl -s -X POST http://localhost:8080/api/agent/chat -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"message\":\"帮我总结要点\",\"text\":\"坚持党的全面领导，推进高质量发展。\"}"
```

可选 IT（需 MySQL + Agent）：

```bash
cd Web/backend
# Windows PowerShell:
$env:AGENT_IT="true"; mvn -q test "-Dtest=AgentIntegrationIT"
```

日常单测：

```bash
cd Web/backend
mvn -q test "-Dtest=AgentPayloadSerializationTest,KnowledgeControllerTest"
cd ../agent
.venv\Scripts\python.exe -m pytest tests/test_ingest_recommend.py -v
```

### Agent API 契约（Backend 转发）

| 方法 | 路径 | 关键请求字段（snake_case） |
|------|------|---------------------------|
| POST | `/ingest` | `document_id`, `kb_type`(`PERSONAL`/`LEARNING`), `text`, `user_id`, `branch_id` |
| POST | `/recommend` | `user_id`, `branch_id`, `query`（空则默认「推荐学习」） |
| POST | `/chat` | `user_id`, `branch_id`, `role`, `message`, `document_id?`, `text?`, `history?` |

Backend 会把 `null` 的 `branch_id`/`user_id` 规范成 `""`，避免 FastAPI 422。

---

## 后期可扩展说明

目录与 API 边界已留好：考试业务可在 Backend `/api/exams` + Web「考试管理」上扩展；Agent 侧 ingest/recommend/chat 契约稳定后可换真实 Embedding / 更强 RAG；Mobile 可按需增加管理端能力。密钥与本地产物由各层 `.gitignore` 忽略（见 `Web/.gitignore` 及子项目）。
