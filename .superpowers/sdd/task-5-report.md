# Task 5 Report: 知识库元数据 API + AgentClient 转发骨架

**Status:** DONE  
**Branch:** `lyb`  
**Commit:** `ed7afc8` (`feat: add knowledge metadata APIs and agent client forwarding`)  
**Date:** 2026-07-24

## Summary

Implemented knowledge document metadata (MySQL) with upload → Agent `/ingest` sync status, role-filtered listing, and AgentClient RestClient forwarding for recommend/chat. When the Agent is unreachable, upload marks `FAILED`; recommend/chat return HTTP 503 with `ApiResponse.code=503`.

| Area | Files |
|------|--------|
| Knowledge | `KbDocument`, `KbType`, `SyncStatus`, `KbDocumentRepository`, `KnowledgeUploadRequest`, `KbDocumentView`, `KnowledgeService`, `KnowledgeController` |
| Agent | `AgentClient`, `AgentController`, `AgentUnavailableException`, DTOs (`IngestPayload`, `RecommendRequest/Payload/Response`, `ChatRequest/Payload/Response`, …) |
| Config | `AgentClientConfig` — RestClient bean → `app.agent.base-url` (2s connect / 10s read) |
| Errors | `GlobalExceptionHandler` — `AgentUnavailableException` → 503 + `智能体服务暂不可用` |
| Test | `KnowledgeControllerTest` (H2); `application-test.yml` agent URL `http://127.0.0.1:9` |

### API contracts

- `POST /api/knowledge/upload` `{ title, kbType, content, sourceName }` → save `PENDING` → Agent `/ingest` → `SYNCED` or `FAILED`
- `GET /api/knowledge` — ADMIN all; SECRETARY own `branchId`; MEMBER own PERSONAL + LEARNING (own branch / global `branchId=null`)
- `POST /api/agent/recommend` `{ query? }` → Agent `/recommend` (injects `user_id`, `branch_id`)
- `POST /api/agent/chat` `{ message, documentId?, text?, history? }` → Agent `/chat` (injects user/branch/role; checks document access if `documentId` set)

AgentClient methods: `ingest`, `recommend`, `chat`. Payloads use snake_case JSON for Agent Task 7 alignment.

## Verification

```bash
mvn -q test "-Dtest=KnowledgeControllerTest,AuthControllerTest,BranchControllerTest,PartySchoolApplicationTests"
# PASS — upload→FAILED when agent down; recommend/chat→503; prior auth/branch tests green
```

Manual curl against live MySQL backend not run (Agent Tasks 6–7 not present; H2 tests cover the down-agent behavior required by the brief).

## Concerns

1. **No live MySQL/curl smoke** — verified via H2 MockMvc only; production profile still needs MySQL for a real curl pass.
2. **Upload content not stored in MySQL** — only metadata + one-shot forward of `content` to Agent (as designed for Task 5/7); no local content column.
3. **LEARNING upload allowed for MEMBER** — any authenticated role may upload; branch/owner taken from principal. Stricter write rules can wait for product clarification.
