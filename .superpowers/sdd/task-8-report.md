# Task 8 Report: 打通 Backend ↔ Agent 真联调

**Status:** DONE_WITH_CONCERNS  
**Branch:** `lyb`  
**Commit:** `47ccc0a` (`fix: align backend agent payloads and document integration steps`)  
**Date:** 2026-07-24

## Summary

Aligned Backend → Agent JSON contracts so null/`blank` fields no longer 422 FastAPI, documented live integration steps in `Web/README.md`, and added payload contract tests plus an opt-in live IT.

| Area | Change |
|------|--------|
| Backend | `AgentPayloads` normalizes `user_id`/`branch_id` to `""`, blank recommend `query` → `推荐学习`; used by `KnowledgeService` + `AgentController` |
| Agent | `payload_compat` + validators on `/ingest` `/recommend` `/chat` accept `null` ids and blank query |
| Tests | `AgentPayloadSerializationTest` (snake_case contract); agent pytest for backend-shaped bodies; `AgentIntegrationIT` (`AGENT_IT=true`) |
| Docs | `Web/README.md` — Agent API table + Backend↔Agent 联调 steps |

## Verification

```bash
# Backend (H2)
mvn -q test "-Dtest=AgentPayloadSerializationTest,KnowledgeControllerTest,AuthControllerTest,BranchControllerTest,PartySchoolApplicationTests"
# PASS

# Agent
.venv\Scripts\python.exe -m pytest tests/test_ingest_recommend.py tests/test_health.py -v
# PASS — 10 passed

# Live agent curl (uvicorn :8000; MySQL/docker down)
# health ok; recommend/chat degrade with null branch_id; ingest → kb_learning SYNC path at agent
```

Live full path `member login → upload SYNCED → recommend → chat` via Backend **not** run: Docker Compose empty (MySQL down). `AgentIntegrationIT` ready when `AGENT_IT=true` + MySQL + Agent up.

## Concerns

1. **No end-to-end Backend↔MySQL live run** — Docker/MySQL not running; status is DONE_WITH_CONCERNS until IT or manual curl through `:8080` succeeds.
2. **Ingest still needs Milvus** for real SYNCED uploads; agent smoke ingest succeeded locally (Milvus reachable) but Backend upload not exercised live.
3. **Blank query default** — both sides default to `推荐学习`; callers that relied on empty query semantics should pass an explicit query.
