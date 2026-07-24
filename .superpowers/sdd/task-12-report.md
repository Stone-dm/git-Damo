# Task 12 Report: 总 README、gitignore、端到端验收

**Status:** DONE_WITH_CONCERNS  
**Branch:** `lyb`  
**Commit:** `9ab3828` (`docs: complete Web scaffold README and gitignores`)  
**Date:** 2026-07-24

## Summary

Completed `Web/README.md` with full cold-start order (compose → agent → backend → frontend → mobile), seed accounts, DeepSeek key notes, and E2E checklist. Added `Web/.gitignore` plus tightened per-package ignores so `.env`, `node_modules`, `.venv`, and `target` are ignored.

| Area | Change |
|------|--------|
| Docs | `Web/README.md` — startup order, ports, seed table, DeepSeek, curl smoke, extensibility note |
| Ignore | New `Web/.gitignore`; updated `backend` / `frontend` / `agent` / `mobile` `.gitignore` |

## Verification (feasible in this environment)

| Check | Result |
|-------|--------|
| `git check-ignore` `.env` / `.venv` / `target` / `node_modules` | PASS |
| Agent `GET /health` | PASS — `{"status":"ok"}` |
| Agent `POST /recommend` + `/chat` | PASS — non-empty JSON (console encoding garbled; structure OK) |
| Agent pytest (`test_health` + `test_ingest_recommend`) | PASS — 10 passed |
| Frontend `npm run build` | PASS |
| Frontend `http://localhost:5173/` | PASS — HTTP 200 |
| Mobile `npm run typecheck` | PASS |
| `Web/docker compose up -d` | BLOCKED — Docker Hub pull timeout (`registry-1.docker.io`) |
| Backend `mvn spring-boot:run` | BLOCKED — JDBC fail: `Access denied for user 'party'@'localhost'` (no project MySQL; foreign :3306) |
| Three-role Web login / menus live | BLOCKED — no Backend `:8080` |
| Knowledge ingest MySQL + Milvus via Backend | BLOCKED — Backend down; project compose not up |
| Web/Mobile recommend & assistant via Backend | BLOCKED — Backend down; Agent-only path verified |
| Expo Go / device smoke | BLOCKED — not run |
| Exams placeholder route | CODE/BUILD OK — live list needs Backend |

### Checklist (brief Step 2)

- [ ] 三角色 Web 登录与权限菜单 — **BLOCKED** (Backend/MySQL)
- [ ] 知识入库 MySQL + Milvus — **BLOCKED** (compose pull + Backend)
- [x] Web/Mobile 推荐 — **PARTIAL**: Agent `/recommend` OK; Web/Mobile via Backend blocked
- [x] Web/Mobile 助手总结 — **PARTIAL**: Agent `/chat` OK; Web/Mobile via Backend blocked
- [x] 考试页占位可达 — **PARTIAL**: route/page in build; live API list blocked

## Remaining blockers for local full E2E

1. Pull / start `Web/docker-compose.yml` (MySQL + Milvus + etcd + minio) — Hub network currently fails; free `:3306` / `:19530` if other stacks occupy them.
2. Copy `Web/.env.example` → `Web/.env`; set `DEEPSEEK_API_KEY` for non-degraded LLM (optional for smoke).
3. Start Backend against compose MySQL (`party`/`party123` / `party_school`) so seed accounts exist.
4. Browser: login `admin` / `secretary` / `member` on `:5173` and confirm role menus.
5. Member knowledge upload → `syncStatus=SYNCED`; then Web recommend/assistant.
6. Mobile: set `EXPO_PUBLIC_API_BASE_URL` to LAN IP; Expo Go login + 推荐 / 助手 tabs.

## Concerns

1. Full browser E2E not completed — environment lacks project MySQL and cannot pull compose images.
2. Port `:3306` is open but not `party` credentials — likely unrelated local MySQL; do not assume it is the scaffold DB.
3. Separate `docker-milvus-1` already binds `:19530` — may conflict when project compose finally starts.
