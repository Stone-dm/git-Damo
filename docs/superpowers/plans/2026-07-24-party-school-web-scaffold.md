# 党校学习系统 Web 骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `Web/` 下搭好可运行骨架：React Web + Expo Mobile + Spring Boot + LangChain Agent，打通登录权限、双知识库（MySQL 元数据 + Milvus 向量）、个性化推荐与个人 AI 助手。

**Architecture:** Web / Mobile 只调 Spring Boot（JWT）；Spring Boot 管业务与权限，并转发 Agent；Python FastAPI + LangChain 负责 ingest / recommend / chat，向量写入 Milvus，业务数据存 MySQL。

**Tech Stack:** React+Vite+TS、Expo+RN+TS、Spring Boot 3 + Java 17、FastAPI + LangChain、DeepSeek、MySQL、Milvus、docker-compose

**Spec:** `docs/superpowers/specs/2026-07-24-party-school-web-design.md`

## Global Constraints

- 所有新代码放在仓库根目录 `Web/` 下
- 业务库 MySQL；向量库 Milvus（collections：`kb_personal`、`kb_learning`）
- 大模型 DeepSeek；API Key 仅环境变量 / `.env`，禁止提交密钥
- 角色枚举固定：`ADMIN` / `SECRETARY` / `MEMBER`
- 前端（Web/Mobile）禁止直连 Agent / DeepSeek / Milvus
- 第一版考试仅占位；助手不做学习计划生成与会话持久化
- Java 包名：`com.damo.partyschool`
- 默认端口：frontend `5173`、backend `8080`、agent `8000`、MySQL `3306`、Milvus `19530`

---

## File Map（将创建的主要文件）

```
Web/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/damo/partyschool/
│       ├── PartySchoolApplication.java
│       ├── config/{SecurityConfig,CorsConfig,JwtProperties}.java
│       ├── auth/{AuthController,JwtService,JwtAuthFilter}.java
│       ├── user/{User,UserRepository,UserService,UserController,Role}.java
│       ├── branch/{Branch,BranchRepository,BranchService,BranchController}.java
│       ├── learning/{LearningContent,LearningRepository,LearningController}.java
│       ├── exam/{Exam,ExamRepository,ExamController}.java
│       ├── knowledge/{KbDocument,KbDocumentRepository,KnowledgeService,KnowledgeController}.java
│       ├── agent/{AgentClient,AgentController,RecommendRequest,ChatRequest}.java
│       ├── common/{ApiResponse,GlobalExceptionHandler}.java
│       └── seed/DataSeeder.java
│   └── src/main/resources/application.yml
│   └── src/test/java/.../auth/AuthControllerTest.java
├── agent/
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/main.py
│   ├── app/config.py
│   ├── app/api/{health,ingest,recommend,chat}.py
│   ├── app/rag/{chunking,embeddings}.py
│   ├── app/stores/milvus_store.py
│   ├── app/recommend/chain.py
│   ├── app/assistant/chain.py
│   └── tests/test_health.py
├── frontend/
│   ├── package.json, vite.config.ts, index.html
│   └── src/{main.tsx,App.tsx,api/client.ts,auth/*,layouts/*,pages/*}
└── mobile/
    ├── package.json, app.json, app/_layout.tsx
    └── app/{login.tsx,(member)/_layout.tsx,(member)/learning.tsx,(member)/recommend.tsx,(member)/assistant.tsx,(member)/me.tsx}
    └── src/{api/client.ts,auth/token.ts}
```

---

### Task 1: 基础设施 — docker-compose（MySQL + Milvus）

**Files:**
- Create: `Web/docker-compose.yml`
- Create: `Web/.env.example`
- Create: `Web/README.md`（先写基础设施小节，后续任务追加）

**Interfaces:**
- Produces: MySQL `localhost:3306`（库名 `party_school`，用户/密码见 `.env.example`）；Milvus `localhost:19530`

- [ ] **Step 1: 创建 `Web/docker-compose.yml`**

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: party-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: party_school
      MYSQL_USER: party
      MYSQL_PASSWORD: party123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 20

  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    container_name: party-etcd
    environment:
      ETCD_AUTO_COMPACTION_MODE: revision
      ETCD_AUTO_COMPACTION_RETENTION: "1000"
      ETCD_QUOTA_BACKEND_BYTES: "4294967296"
      ETCD_SNAPSHOT_COUNT: "50000"
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    volumes:
      - etcd_data:/etcd

  minio:
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    container_name: party-minio
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    command: minio server /minio_data --console-address ":9001"
    volumes:
      - minio_data:/minio_data
    ports:
      - "9001:9001"

  milvus:
    image: milvusdb/milvus:v2.3.4
    container_name: party-milvus
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - milvus_data:/var/lib/milvus
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - etcd
      - minio

volumes:
  mysql_data:
  etcd_data:
  minio_data:
  milvus_data:
```

- [ ] **Step 2: 创建 `Web/.env.example`**

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=party_school
MYSQL_USER=party
MYSQL_PASSWORD=party123

MILVUS_HOST=localhost
MILVUS_PORT=19530

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
EMBEDDING_API_KEY=
EMBEDDING_BASE_URL=
EMBEDDING_MODEL=text-embedding-3-small

JWT_SECRET=change-me-to-a-long-random-string
AGENT_BASE_URL=http://localhost:8000
BACKEND_BASE_URL=http://localhost:8080
```

- [ ] **Step 3: 写 README 基础设施节**

在 `Web/README.md` 写：如何 `docker compose up -d`、等待 MySQL healthy、默认账号密码表（后续 DataSeeder 账号也写这里）。

- [ ] **Step 4: 启动并验证**

```bash
cd Web
docker compose up -d
docker compose ps
```

Expected: `mysql`、`milvus`、`etcd`、`minio` 均为 running（或 milvus healthy）。

- [ ] **Step 5: Commit**

```bash
git add Web/docker-compose.yml Web/.env.example Web/README.md
git commit -m "chore: add MySQL and Milvus docker-compose for Web scaffold"
```

---

### Task 2: Spring Boot 工程骨架 + 统一响应/安全配置

**Files:**
- Create: `Web/backend/pom.xml`
- Create: `Web/backend/src/main/java/com/damo/partyschool/PartySchoolApplication.java`
- Create: `Web/backend/src/main/resources/application.yml`
- Create: `Web/backend/src/main/java/com/damo/partyschool/common/ApiResponse.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/common/GlobalExceptionHandler.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/config/CorsConfig.java`
- Test: `Web/backend/src/test/java/com/damo/partyschool/PartySchoolApplicationTests.java`

**Interfaces:**
- Produces: 可启动的空 Spring Boot 应用；`ApiResponse<T>` 形状 `{ code, message, data }`

- [ ] **Step 1: 创建 Maven `pom.xml`**

依赖：`spring-boot-starter-web`、`spring-boot-starter-data-jpa`、`spring-boot-starter-security`、`spring-boot-starter-validation`、`mysql-connector-j`、`jjwt-api/impl/jackson`（0.12.x）、`lombok`、`spring-boot-starter-test`、`spring-security-test`。  
Parent：`spring-boot-starter-parent` `3.2.5`，Java 17。

- [ ] **Step 2: 应用入口与 `application.yml`**

```yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/${MYSQL_DB:party_school}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8
    username: ${MYSQL_USER:party}
    password: ${MYSQL_PASSWORD:party123}
  jpa:
    hibernate:
      ddl-auto: update
    open-in-view: false
    properties:
      hibernate.format_sql: true
app:
  jwt:
    secret: ${JWT_SECRET:change-me-to-a-long-random-string}
    expire-ms: 86400000
  agent:
    base-url: ${AGENT_BASE_URL:http://localhost:8000}
```

- [ ] **Step 3: `ApiResponse` + `GlobalExceptionHandler`**

```java
public record ApiResponse<T>(int code, String message, T data) {
  public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(0, "ok", data); }
  public static ApiResponse<Void> ok() { return new ApiResponse<>(0, "ok", null); }
  public static ApiResponse<Void> fail(int code, String message) { return new ApiResponse<>(code, message, null); }
}
```

Handler 映射：`IllegalArgumentException` → 400；`AccessDeniedException` → 403；其余 → 500，body 用 `ApiResponse.fail`。

- [ ] **Step 4: CORS 允许 `http://localhost:5173`**

- [ ] **Step 5: 运行上下文加载测试**

```bash
cd Web/backend
mvn -q test -Dtest=PartySchoolApplicationTests
```

Expected: PASS（需 MySQL 已启动；若测试不想连真实库，可先用 `@SpringBootTest` + 真实 MySQL，或本任务暂用 `ddl-auto` 连 docker MySQL）。

- [ ] **Step 6: Commit**

```bash
git add Web/backend
git commit -m "feat: scaffold Spring Boot backend with ApiResponse and CORS"
```

---

### Task 3: 用户/支部实体 + 登录 JWT + 种子账号

**Files:**
- Create: `Web/backend/src/main/java/com/damo/partyschool/user/Role.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/user/User.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/user/UserRepository.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/branch/Branch.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/branch/BranchRepository.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/auth/*`
- Create: `Web/backend/src/main/java/com/damo/partyschool/config/SecurityConfig.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/seed/DataSeeder.java`
- Test: `Web/backend/src/test/java/com/damo/partyschool/auth/AuthControllerTest.java`

**Interfaces:**
- Produces:
  - `POST /api/auth/login` body `{ username, password }` → `{ token, user: { id, username, name, role, branchId } }`
  - `GET /api/me` → 当前用户
  - Roles: `ADMIN` / `SECRETARY` / `MEMBER`
- Seed users: `admin/admin123`、`secretary/sec123`、`member/mem123`（同一演示支部）

- [ ] **Step 1: 写失败测试 `AuthControllerTest`**

使用 `@SpringBootTest` + `@AutoConfigureMockMvc`：  
1) 用种子账号登录期望 200 且有 `data.token`；  
2) 错误密码期望非 0 code 或 401；  
3) 带 token 调 `/api/me` 返回 `MEMBER`/`ADMIN` 等。

- [ ] **Step 2: 跑测试确认失败**

```bash
mvn -q test -Dtest=AuthControllerTest
```

Expected: FAIL（控制器不存在）

- [ ] **Step 3: 实现实体与 JWT**

- `User` 字段：`id, username, passwordHash, name, role(Role enum), branchId(Long nullable for ADMIN)`
- `Branch`：`id, name, description`
- `JwtService`：生成/解析 subject=username，claims 含 `uid, role, branchId`
- `JwtAuthFilter`：Authorization Bearer
- `SecurityConfig`：放行 `/api/auth/login`、`/actuator/health`（若无 actuator 则仅 login）；其余需认证；禁用 CSRF；无 session
- `AuthController` + `DataSeeder`（`ApplicationRunner`，仅当库空时插入）

密码用 `BCryptPasswordEncoder`。

- [ ] **Step 4: 跑测试至 PASS**

```bash
mvn -q test -Dtest=AuthControllerTest
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Web/backend
git commit -m "feat: add JWT login, roles, and seed users"
```

---

### Task 4: 用户/支部 CRUD + 学习/考试占位 API

**Files:**
- Create: `user/UserController.java`, `UserService.java`
- Create: `branch/BranchController.java`, `BranchService.java`
- Create: `learning/*`, `exam/*`
- Test: `Web/backend/src/test/java/com/damo/partyschool/branch/BranchControllerTest.java`

**Interfaces:**
- `GET/POST/PUT/DELETE /api/users` — ADMIN 全量；SECRETARY 仅本支部 MEMBER
- `GET/POST/PUT/DELETE /api/branches` — 仅 ADMIN 写；SECRETARY/MEMBER 可读自己支部
- `GET /api/learning` — 按角色过滤（ADMIN 全；SECRETARY 本支部+全局；MEMBER 可见范围）
- `GET /api/exams` — 占位列表
- LearningContent：`id, title, summary, branchId(nullable=全局), createdAt`
- Exam：`id, title, status(DRAFT/OPEN), branchId`

- [ ] **Step 1: 写 Branch 权限测试**

SECRETARY 不能创建其他支部；ADMIN 可以创建支部。

- [ ] **Step 2: 实现 Service 层权限校验**

统一方法示例：

```java
public void assertCanManageBranch(User actor, Long branchId) {
  if (actor.getRole() == Role.ADMIN) return;
  if (actor.getRole() == Role.SECRETARY && Objects.equals(actor.getBranchId(), branchId)) return;
  throw new AccessDeniedException("无权操作该支部");
}
```

- [ ] **Step 3: DataSeeder 增加 2～3 条 learning 与 1 条 exam**

- [ ] **Step 4: 测试 PASS 后 Commit**

```bash
git commit -m "feat: add users, branches, learning and exam placeholder APIs"
```

---

### Task 5: 知识库元数据 API + AgentClient 转发骨架

**Files:**
- Create: `knowledge/KbDocument.java`（字段：`id, title, kbType(PERSONAL|LEARNING), ownerUserId, branchId, sourceName, syncStatus(PENDING|SYNCED|FAILED), createdAt`）
- Create: `knowledge/KnowledgeService.java`, `KnowledgeController.java`
- Create: `agent/AgentClient.java`（WebClient/RestClient）
- Create: `agent/AgentController.java`
- Create DTOs: `RecommendRequest`, `ChatRequest`, `IngestPayload`

**Interfaces:**
- `POST /api/knowledge/upload` body: `{ title, kbType, content, sourceName }`  
  → 写 MySQL `PENDING` → 调 Agent `/ingest` → 成功则 `SYNCED`
- `GET /api/knowledge` 按权限过滤
- `POST /api/agent/recommend` → Agent `/recommend`
- `POST /api/agent/chat` body: `{ message, documentId?, text?, history? }` → Agent `/chat`
- AgentClient 方法：
  - `void ingest(IngestPayload payload)`
  - `RecommendResponse recommend(RecommendPayload payload)`
  - `ChatResponse chat(ChatPayload payload)`

Agent 不可用时：Knowledge 标记 `FAILED`；recommend/chat 返回 `ApiResponse.fail(503, "智能体服务暂不可用")`。

- [ ] **Step 1: 实现实体与 upload（可先 Mock AgentClient 返回成功）**

- [ ] **Step 2: 实现真实 RestClient 指向 `app.agent.base-url`**

- [ ] **Step 3: 手动用 curl 测 upload（Agent 未起时期望 FAILED 或 503，行为符合上文）**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add knowledge metadata APIs and agent client forwarding"
```

---

### Task 6: Python Agent — 健康检查 + 配置 + Milvus store

**Files:**
- Create: `Web/agent/requirements.txt`
- Create: `Web/agent/app/config.py`
- Create: `Web/agent/app/main.py`
- Create: `Web/agent/app/api/health.py`
- Create: `Web/agent/app/stores/milvus_store.py`
- Create: `Web/agent/app/rag/chunking.py`
- Create: `Web/agent/app/rag/embeddings.py`
- Test: `Web/agent/tests/test_health.py`

**Interfaces:**
- `GET /health` → `{ status: "ok" }`
- `MilvusStore.ensure_collections()`
- `MilvusStore.upsert(collection, rows)`
- `MilvusStore.search(collection, vector, filter_expr, top_k) -> list[{text, document_id, score}]`
- Collections: `kb_personal`, `kb_learning`；向量维度与 embedding 模型一致（在 config 中常量 `EMBEDDING_DIM`，默认 1536，可配置）

`requirements.txt` 含：`fastapi`、`uvicorn`、`langchain`、`langchain-openai`（DeepSeek 兼容 OpenAI 接口）、`pymilvus`、`pydantic-settings`、`httpx`、`pytest`、`httpx` for TestClient。

- [ ] **Step 1: 写 `test_health` 用 TestClient 断言 `/health` 200**

- [ ] **Step 2: 实现 app 与 milvus_store（启动时 ensure_collections）**

- [ ] **Step 3:**

```bash
cd Web/agent
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
pytest tests/test_health.py -v
uvicorn app.main:app --reload --port 8000
```

Expected: health PASS；Milvus 可连则 collections 创建成功。

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: scaffold LangChain agent with Milvus store and health API"
```

---

### Task 7: Agent — ingest / recommend / chat

**Files:**
- Create: `Web/agent/app/api/ingest.py`
- Create: `Web/agent/app/api/recommend.py`
- Create: `Web/agent/app/api/chat.py`
- Create: `Web/agent/app/recommend/chain.py`
- Create: `Web/agent/app/assistant/chain.py`
- Test: `Web/agent/tests/test_ingest_recommend.py`（可用假 embedding 或 mock）

**Interfaces:**

`POST /ingest`
```json
{
  "document_id": "1",
  "kb_type": "PERSONAL",
  "text": "...",
  "user_id": "3",
  "branch_id": "1"
}
```
→ chunk → embed → upsert 对应 collection

`POST /recommend`
```json
{ "user_id": "3", "branch_id": "1", "query": "近期适合学什么" }
```
→ 检索两库 → DeepSeek 生成 `{ items: [{ title, reason, document_id? }] }`  
无 Key / 检索空：降级返回通用建议 items。

`POST /chat`
```json
{
  "user_id": "3",
  "branch_id": "1",
  "role": "MEMBER",
  "message": "请总结这份材料",
  "document_id": "1",
  "text": null,
  "history": [{"role":"user","content":"..."},{"role":"assistant","content":"..."}]
}
```
→ 有 text/document 上下文则总结整理；否则双库检索问答 → `{ reply: "..." }`

DeepSeek 经 OpenAI 兼容客户端：`base_url=DEEPSEEK_BASE_URL`，`api_key=DEEPSEEK_API_KEY`，`model=DEEPSEEK_MODEL`。

- [ ] **Step 1: 实现 chunking（按字符 500，overlap 50）**

- [ ] **Step 2: 实现 embeddings 客户端（OpenAI compatible）；无 Key 时用确定性伪向量仅用于打通链路（文档注明）**

- [ ] **Step 3: 实现三条 API + 降级逻辑**

- [ ] **Step 4: 联调**

```bash
curl -X POST http://localhost:8000/ingest -H "Content-Type: application/json" -d "{\"document_id\":\"1\",\"kb_type\":\"LEARNING\",\"text\":\"党的二十大报告学习要点……\",\"user_id\":\"1\",\"branch_id\":\"1\"}"
curl -X POST http://localhost:8000/recommend -H "Content-Type: application/json" -d "{\"user_id\":\"3\",\"branch_id\":\"1\",\"query\":\"推荐学习\"}"
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d "{\"user_id\":\"3\",\"branch_id\":\"1\",\"role\":\"MEMBER\",\"message\":\"帮我总结要点\",\"text\":\"测试文档内容……\"}"
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add agent ingest, recommend, and chat endpoints"
```

---

### Task 8: 打通 Backend ↔ Agent 真联调

**Files:**
- Modify: `KnowledgeService`、`AgentClient` 字段名与 Agent 对齐
- Modify: `Web/README.md` 联调步骤
- Test: 手动脚本或 `Web/backend/src/test/java/.../AgentIntegrationIT.java`（可 `@EnabledIfEnvironmentVariable`）

- [ ] **Step 1: 同时启动 MySQL/Milvus、agent、backend**

- [ ] **Step 2: 登录 member → upload LEARNING 文本 → recommend → chat**

Expected: upload `SYNCED`；recommend/chat 返回非空可读内容（或降级文案）。

- [ ] **Step 3: Commit 修复与 README**

```bash
git commit -m "fix: align backend agent payloads and document integration steps"
```

---

### Task 9: React Web 前端骨架（登录 + 角色布局）

**Files:**
- Create: `Web/frontend/` Vite React-TS 工程
- Create: `src/api/client.ts`（axios/fetch + Bearer）
- Create: `src/auth/AuthContext.tsx`
- Create: `src/layouts/AppLayout.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/DashboardPage.tsx`
- Create: `src/App.tsx`（react-router）

**Interfaces:**
- 登录成功写 `localStorage.token`
- 路由守卫：无 token → `/login`
- 菜单按 role 显示（ADMIN/SECRETARY/MEMBER）

- [ ] **Step 1:**

```bash
cd Web
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom
```

- [ ] **Step 2: 实现 api client、AuthContext、Login、Layout**

- [ ] **Step 3:**

```bash
npm run dev
```

Expected: 浏览器可登录三个种子账号并看到不同菜单。

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add React web app with JWT auth and role layout"
```

---

### Task 10: Web 页面 — 管理/学习/知识库/推荐/助手/考试占位

**Files:**
- Create pages:
  - `UsersPage.tsx`, `BranchesPage.tsx`
  - `LearningPage.tsx`, `ExamsPage.tsx`（占位）
  - `KnowledgePage.tsx`（列表 + 文本入库表单）
  - `RecommendPage.tsx`
  - `AssistantPage.tsx`（聊天 UI）

**Interfaces:**
- 全部走 `src/api/*.ts` 封装的 backend 路径
- Assistant：消息列表 + 输入框；可选「附加文本」用于总结

- [ ] **Step 1: 实现各页面最小可用 UI（简洁表格/列表，不追求视觉炫技）**

- [ ] **Step 2: 用三角色点一遍主路径**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add web pages for admin, knowledge, recommend, and assistant"
```

---

### Task 11: Expo Mobile 骨架 + 党员主路径

**Files:**
- Create: `Web/mobile/` Expo Router TypeScript 应用
- Create: `app/login.tsx`
- Create: `app/(member)/_layout.tsx`（tabs：学习/推荐/助手/我的）
- Create: `app/(member)/learning.tsx`
- Create: `app/(member)/recommend.tsx`
- Create: `app/(member)/assistant.tsx`
- Create: `app/(member)/me.tsx`
- Create: `src/api/client.ts`, `src/auth/token.ts`（expo-secure-store）

**Interfaces:**
- `EXPO_PUBLIC_API_BASE_URL` 指向电脑局域网 IP 的 `:8080`（README 写明）
- 管理员/书记登录后 me 页提示使用 Web 管理端；仍可进入助手 tab

- [ ] **Step 1:**

```bash
cd Web
npx create-expo-app@latest mobile --template tabs
# 或官方 expo-router template；保证 TypeScript
cd mobile
npx expo install expo-secure-store
```

若默认模板不是 expo-router，按 Expo Router 文档改成 `app/` 目录路由。

- [ ] **Step 2: 实现登录与四个 Tab 调同一 API**

- [ ] **Step 3: Expo Go / 模拟器验证登录、学习列表、推荐、助手**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add Expo mobile app with learning, recommend, and assistant"
```

---

### Task 12: 总 README、gitignore、端到端验收

**Files:**
- Modify: `Web/README.md`（完整启动顺序）
- Create: `Web/backend/.gitignore`, `Web/frontend/.gitignore`, `Web/mobile/.gitignore`, `Web/agent/.gitignore`
- Create: `Web/.gitignore`（`.env`、`node_modules`、`.venv`、`target` 等）

- [ ] **Step 1: README 必须包含**
  1. docker compose
  2. agent venv + uvicorn
  3. backend mvn spring-boot:run
  4. frontend npm run dev
  5. mobile expo start + API Base URL 说明
  6. 种子账号表
  7. DeepSeek Key 配置

- [ ] **Step 2: 按 README 冷启动验收清单**
  - [ ] 三角色 Web 登录与权限菜单
  - [ ] 知识入库 MySQL + Milvus
  - [ ] Web/Mobile 推荐
  - [ ] Web/Mobile 助手总结
  - [ ] 考试页占位可进

- [ ] **Step 3: Commit**

```bash
git add Web
git commit -m "docs: complete Web scaffold README and gitignores"
```

---

## Spec Coverage Self-Check

| Spec 项 | Task |
|---|---|
| React Web | 9–10 |
| Expo Mobile | 11 |
| Spring Boot 业务/JWT/角色 | 2–5 |
| LangChain Agent + DeepSeek | 6–7 |
| MySQL | 1, 3–5 |
| Milvus 双 collection | 6–7 |
| 推荐双端 | 7, 10, 11 |
| 个人 AI 助手双端 | 7, 10, 11 |
| 考试占位 | 4, 10 |
| 后期可扩展 | 目录与 API 边界已留；Task 12 README 说明 |

## Placeholder Scan

无 TBD/TODO 步骤；接口字段与路径已写死；降级行为已写明。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-24-party-school-web-scaffold.md`.

**两种执行方式：**

**1. Subagent-Driven（推荐）** — 每个 Task 派一个新子代理，任务间做审查，迭代快  

**2. Inline Execution** — 本会话内按 executing-plans 连续执行，设检查点  

你选哪一种？
