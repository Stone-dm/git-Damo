# Final fix report (lyb whole-branch review)

**Status:** Done  
**Branch:** `lyb`  
**Commit:** `84ad7eed3c36b3dd2a0fe2e4da67386bd60ad84b`  
**Date:** 2026-07-24

## Tests

| Suite | Command | Result |
|-------|---------|--------|
| Backend | `cd Web/backend && mvn -q test` | Pass |
| Agent | `cd Web/agent && .venv\Scripts\python.exe -m pytest -q` | 17 passed |

## Fixes applied

1. **Milvus LEARNING filters omit global docs** — Added `learning_filter_expr` so LEARNING retrieval includes `branch_id` **or** global `branch_id == ""`. ADMIN empty `branch_id` + `document_id` chat searches by document only.
2. **Secretary PERSONAL list over-broad** — SECRETARY list/access now matches per-user PERSONAL ACL: LEARNING for branch + global, plus own PERSONAL only (no other members’ PERSONAL).
3. **Agent open surface** — Optional `X-Agent-Token` / `AGENT_SHARED_TOKEN`; empty token = open with startup warning. Backend `AgentClient` sends header from `app.agent.shared-token`. Documented in `Web/README.md` / `.env.example`.
4. **500 leak** — `GlobalExceptionHandler` returns `"服务器内部错误"` for generic exceptions; real stack logged server-side.
5. **JSON auth entrypoint** — `JsonAuthenticationEntryPoint` + `JsonAccessDeniedHandler` return `ApiResponse` `{code,message}` for 401/403.

## Focused tests added

- `KnowledgeControllerTest.secretaryListExcludesOtherMembersPersonalDocs`
- `AuthControllerTest.meWithoutTokenReturnsJsonUnauthorized`
- Agent LEARNING filter + token gate tests (`test_learning_filters.py`, `test_ingest_recommend.py`)
