# Task 9 Report: React Web 前端骨架（登录 + 角色布局）

**Status:** DONE_WITH_CONCERNS  
**Branch:** `lyb`  
**Commit:** `40f1d8c` (`feat: add React web app with JWT auth and role layout`)  
**Date:** 2026-07-24

## Summary

Created `Web/frontend` Vite React-TS app with JWT login (`localStorage.token`), route guard to `/login`, role-based sidebar menus for ADMIN / SECRETARY / MEMBER, dashboard, and placeholder routes for Task 10 pages.

| Area | Change |
|------|--------|
| Scaffold | Vite `react-ts` under `Web/frontend`, `react-router-dom` |
| API | `src/api/client.ts` — fetch + Bearer, `login` / `fetchMe`, base `http://localhost:8080` |
| Auth | `src/auth/AuthContext.tsx` — token bootstrap via `/api/me`, login/logout |
| UI | `LoginPage`, `AppLayout`, `DashboardPage`, role menus in `layouts/menu.ts` |
| Router | Protected layout + placeholders: users/branches/learning/exams/knowledge/recommend/assistant |

## Role menus

| Role | Menus |
|------|--------|
| ADMIN | 工作台, 用户管理, 支部管理, 学习资料, 考试管理, 知识库, 智能推荐, 学习助手 |
| SECRETARY | 工作台, 用户管理, 学习资料, 考试管理, 知识库, 智能推荐, 学习助手 |
| MEMBER | 工作台, 学习资料, 考试管理, 知识库, 智能推荐, 学习助手 |

## Verification

```bash
cd Web/frontend
npm run build
# PASS — tsc -b && vite build

npm run dev
# PASS — http://localhost:5173/

# Live API
# GET http://localhost:8080/actuator/health — unreachable (timeout)
```

## Concerns

1. **Live login untested** — Backend/MySQL down; could not browser-test three seed accounts against `:8080`. App builds and `npm run dev` starts; login UI ready when backend is up.
2. **Placeholder pages** — Non-dashboard routes show Task 10 placeholders only.
3. **CORS** — Backend already allows `http://localhost:5173`; no proxy added.
