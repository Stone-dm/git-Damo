# 党校学习系统（Web + 移动端）设计文档

**日期：** 2026-07-24  
**分支：** `lyb`  
**范围：** 第一版可运行骨架（方案 A）+ Expo 移动端骨架

## 1. 背景与目标

搭建党校学习系统：系统管理员、支部书记、党员三类角色；党员侧提供学习、考试等能力；通过 RAG 双知识库（个人信息库 + 党员学习知识库）与内置智能体，提供个性化学习推荐，以及 **个人 AI 助手**（整理、总结文档、基于知识库问答等）。

同时提供 **Web 管理/学习端** 与 **React Native（Expo）移动端**，共用同一套 Spring Boot API；智能体能力在 **两端都可用**，便于后期继续加功能。

第一版目标：
- Web：三角色登录/权限、基础管理与学习页面、知识库入库/检索、推荐 + 个人 AI 助手可跑通；考试等占位
- Mobile（Expo）：登录 + 党员学习列表 + 个性化推荐 + 个人 AI 助手；管理类功能仍以 Web 为主

## 2. 技术选型

| 层 | 技术 |
|---|---|
| Web 前端 | React + Vite + TypeScript |
| 移动端 | Expo + React Native + TypeScript |
| 业务后端 | Spring Boot 3 + Java 17 |
| 智能体 | Python FastAPI + LangChain |
| 大模型 | DeepSeek |
| 业务库 | MySQL |
| 向量库 | Milvus |
| 部署辅助 | docker-compose（MySQL、Milvus 及依赖） |

**集成方式：** Spring Boot 负责业务与权限；单独 Python LangChain 服务负责 RAG、推荐与个人助手对话；**Web 与 Mobile 都只调用 Spring Boot**，不直连 Agent / DeepSeek / Milvus。

## 3. 整体架构

```
浏览器                         手机 / 模拟器
  └─ React (Vite) :5173         └─ Expo RN App
        │  REST / JWT                  │  REST / JWT
        └────────────┬─────────────────┘
                     ▼
              Spring Boot :8080
              · 登录鉴权、角色权限
              · 用户 / 支部 / 党员
              · 学习内容、考试（占位）
              · 知识库文档元数据
              · 编排调用智能体
                     │  内部 HTTP
                     ▼
              Python Agent :8000
              · LangChain + DeepSeek
              · 切分 / embedding / 检索
              · 个性化学习推荐
              · 个人 AI 助手（总结/整理/问答）
                     │
                ┌────┴────┐
                ▼         ▼
              MySQL     Milvus
              业务表     向量集合
```

### 职责边界

| 层 | 做什么 | 不做什么 |
|---|---|---|
| Web React | 三角色管理/学习页 + 推荐 + AI 助手 | 不直接调 DeepSeek / Milvus |
| Expo Mobile | 党员登录、学习列表、推荐、AI 助手 | 第一版不做复杂管理后台 |
| Spring Boot | 账号权限、业务 CRUD、调用 Agent | 不做向量检索与 Prompt |
| Agent | 入库、检索、推荐、助手对话（总结/整理） | 不管登录和支部权限 |
| MySQL | 用户、支部、学习、考试、文档元数据 | 不存向量 |
| Milvus | PERSONAL / LEARNING 两套向量集合 | 不存业务权限规则 |

权限在 Spring Boot 强制执行；调用 Agent 时由后端注入当前用户/支部上下文，避免越权。

## 4. 目录结构

```
Web/
├── frontend/                 # React + Vite + TypeScript（Web）
│   ├── src/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── api/
│   │   ├── auth/
│   │   └── components/
│   └── package.json
│
├── mobile/                   # Expo + React Native + TypeScript
│   ├── app/                  # 路由页面（Expo Router）
│   │   ├── login.tsx
│   │   ├── (member)/         # 学习列表、推荐、AI 助手
│   │   └── _layout.tsx
│   ├── src/
│   │   ├── api/              # 同一套 Spring Boot API
│   │   ├── auth/             # JWT 安全存储
│   │   └── components/
│   ├── app.json
│   └── package.json
│
├── backend/                  # Spring Boot 3 + Java 17
│   ├── src/main/java/.../
│   │   ├── auth/
│   │   ├── user/
│   │   ├── branch/
│   │   ├── learning/
│   │   ├── exam/
│   │   ├── knowledge/
│   │   └── agent/            # recommend + chat 转发
│   └── pom.xml
│
├── agent/                    # FastAPI + LangChain
│   ├── app/
│   │   ├── api/              # /ingest、/recommend、/chat、/health
│   │   ├── rag/
│   │   ├── stores/
│   │   ├── recommend/
│   │   └── assistant/        # 个人助手：总结/整理/问答链
│   └── requirements.txt
│
├── docker-compose.yml        # MySQL + Milvus（etcd / minio 等）
└── README.md                 # Web / Mobile / 后端启动说明
```

所有新代码放在仓库根目录下的 `Web/` 文件夹中。

## 5. 角色与页面

**角色枚举：** `ADMIN` / `SECRETARY` / `MEMBER`

### 5.1 Web

| 角色 | 权限 | 第一版页面 |
|---|---|---|
| 系统管理员 | 全局 CRUD | 用户管理、支部管理、全局知识库、系统概览、**个人 AI 助手** |
| 支部书记 | 仅本支部 | 本支部党员、本支部学习安排（占位）、本支部知识、**个人 AI 助手** |
| 党员 | 仅本人相关 | 我的学习、考试入口（占位）、个性化推荐、个人资料知识、**个人 AI 助手** |

### 5.2 Mobile（Expo，第一版）

| 角色 | 第一版页面 |
|---|---|
| 党员（主） | 登录、我的学习列表、个性化推荐、**AI 助手聊天**、简单「我的」页 |
| 管理员 / 书记 | 可登录；可用 **AI 助手**；管理功能提示「请使用 Web 管理端」 |

后期可在 `mobile/` 继续加：考试、消息推送、扫码签到等，无需改整体架构。

### 5.3 智能体能力（Web / Mobile 两端都有）

| 能力 | 第一版 | 说明 |
|---|---|---|
| 个性化学习推荐 | ✅ | 双知识库检索 + DeepSeek |
| 个人 AI 助手对话 | ✅ | 聊天界面；总结文档、提炼要点、整理学习材料 |
| 基于已入库文档问答 | ✅ | 从 PERSONAL / LEARNING 检索后回答 |
| 针对已有文档 / 粘贴文本即时总结 | ✅ 简化版 | 指定 documentId 或传入文本 → 摘要/提纲 |
| 自动生成完整学习计划、复杂多步工作流 | ❌ 后期 | 第一版只做「对话 + 总结/整理/问答」 |

## 6. 数据模型

### 6.1 MySQL（业务）

| 表 | 用途 |
|---|---|
| `users` | 账号、密码哈希、姓名、角色、所属支部 |
| `branches` | 支部（名称、描述） |
| `learning_contents` | 学习内容元数据（标题、简介、支部范围） |
| `exams` | 考试占位（标题、状态；第一版不做答题） |
| `kb_documents` | 知识库文档元数据（标题、类型、归属用户/支部、来源文件、Milvus 同步状态） |

### 6.2 知识库类型

| `kb_type` | 含义 |
|---|---|
| `PERSONAL` | 个人信息库（简历、学习记录摘要、兴趣标签等） |
| `LEARNING` | 党员学习知识库（党课资料、政策文件、学习材料） |

### 6.3 Milvus（向量）

| Collection | 对应 | 主要字段 |
|---|---|---|
| `kb_personal` | PERSONAL | chunk_id, document_id, user_id, text, embedding |
| `kb_learning` | LEARNING | chunk_id, document_id, branch_id, text, embedding |

文档元数据与权限归属在 MySQL；向量与原文块在 Milvus。删除/更新时由 Agent 与后端协同保持一致（第一版以同步写入 + 状态字段为主）。

### 6.4 权限规则

- `ADMIN`：全部 CRUD
- `SECRETARY`：仅 `branch_id = 自己支部`
- `MEMBER`：仅自己的学习/考试/推荐/个人知识；学习库可读支部/全局公开内容

## 7. 核心数据流

### 7.1 个性化推荐（Web / Mobile 相同）

```
用户点「获取推荐」
  → Spring Boot 校验身份，组装上下文（userId, branchId, role）
  → 调用 Agent POST /recommend
  → Agent：
      1. 检索 Milvus kb_personal（该用户近期信息）
      2. 检索 Milvus kb_learning（相关学习资料）
      3. LangChain + DeepSeek 生成推荐列表（标题、理由、关联文档）
  → 返回 Web 或 Mobile 展示
```

### 7.2 个人 AI 助手对话（Web / Mobile 相同）

```
用户在助手页发送消息（可附带 documentId 或粘贴文本）
  → Spring Boot 校验身份与文档访问权限
  → 调用 Agent POST /chat
  → Agent：
      1. 若有 documentId / 文本：用于总结、整理、提炼要点
      2. 否则按用户问题检索 PERSONAL + LEARNING（受权限过滤的归属条件）
      3. LangChain + DeepSeek 生成回复（摘要 / 提纲 / 问答）
  → 返回两端聊天界面展示
```

第一版聊天可为无状态单轮或短上下文多轮（请求内带最近若干条消息即可）；持久化会话历史可后期再加。

### 7.3 知识入库（以 Web 为主）

```
管理员/书记/党员（按权限）在 Web 上传或登记文档
  → Spring Boot 写 MySQL 元数据并鉴权
  → 调 Agent POST /ingest（文本/文件 + kb_type + 归属）
  → 切分 → embedding → 写入对应 Milvus collection
  → 回写 MySQL 同步状态
```

Embedding：优先 DeepSeek 兼容或可配置的 OpenAI 兼容 embedding 接口；通过环境变量配置，保证可替换。

## 8. API 清单

Web 与 Mobile **共用**下列对外 API；不另开移动端专用后端。

### 8.1 Spring Boot（对外）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 登录，返回 JWT |
| GET | `/api/me` | 当前用户信息 |
| CRUD | `/api/users`、`/api/branches` | 按角色鉴权 |
| GET | `/api/learning` | 学习内容列表（可种子数据） |
| GET | `/api/exams` | 考试列表（占位） |
| POST | `/api/knowledge/upload` | 登记文档并触发入库 |
| GET | `/api/knowledge` | 文档列表（按权限过滤） |
| POST | `/api/agent/recommend` | 个性化推荐（转发 Agent） |
| POST | `/api/agent/chat` | 个人 AI 助手对话（总结/整理/问答，转发 Agent） |

### 8.2 Agent（仅后端内网调用）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查 |
| POST | `/ingest` | 文档切分入库到 Milvus |
| POST | `/recommend` | 双库检索 + DeepSeek 生成推荐 |
| POST | `/chat` | 助手对话：总结、整理、基于检索的问答 |

### 8.3 跨端注意

- JWT 鉴权方式一致；Mobile 用安全存储保存 token（如 `expo-secure-store`）
- 开发时 Mobile 需配置可访问的后端地址（本机 IP / `localhost` 映射），写入环境配置，不写死
- CORS：Spring Boot 允许 Web 源；Mobile 非浏览器，主要靠正确 Base URL

## 9. 错误处理

- Web / Mobile：401 跳登录；403 提示无权限；5xx 统一错误提示
- Spring Boot：统一错误体 `{ code, message }`；调用 Agent 超时/失败返回可读提示，不暴露内部堆栈
- Agent：缺 API Key、检索为空时降级（推荐给出通用学习建议；助手明确说明「暂无足够资料」并尽量基于用户原文总结）
- Milvus / MySQL 不可用时，健康检查与接口返回明确依赖错误信息

## 10. 第一版明确不做

- 真实在线答题、阅卷、成绩统计
- 复杂工作流审批、消息推送（后期可在 Mobile 加）
- 文件预览编辑器、音视频课
- Mobile 端完整管理后台
- 助手：自动生成完整学习计划、复杂多步 Agent 工作流、长期会话持久化
- 生产级 API 网关、多租户、完整审计日志（可留扩展点）

## 11. 本地启动目标

1. `docker compose up -d` 启动 MySQL 与 Milvus（及 etcd、minio 等依赖）
2. 启动 `backend`（8080）→ `agent`（8000）→ `frontend`（5173）
3. 启动 `mobile`：`npx expo start`（模拟器或 Expo Go）
4. 预置演示账号：管理员、支部书记、党员各一个
5. 配置 DeepSeek API Key（环境变量 / `.env`，不入库）

## 12. 成功标准（第一版）

- Web：三角色可登录，菜单与数据按权限隔离
- Web：可上传/登记知识文档，元数据进 MySQL，向量进 Milvus
- Web / Mobile：党员可触发推荐，返回基于双库检索的个性化结果（或明确降级提示）
- Web / Mobile：各角色可打开个人 AI 助手，完成总结/整理/简单问答
- Web：学习、考试页面可进入（考试为占位）
- Mobile：可登录，可看学习列表、推荐与助手
- README 能按步骤在本地跑通 Web 与 Mobile

## 13. 后期扩展（预留，不做进第一版实现计划的硬性范围）

- 考试实做、成绩、错题本
- Mobile 消息推送、扫码签到
- 更丰富的知识库管理与文件预览
- 管理端 Mobile 轻量审批
- 助手：学习计划生成、多步工具调用、会话历史持久化与多端同步
