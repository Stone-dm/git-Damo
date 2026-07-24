# Task 10 Report: Web 页面 — 管理/学习/知识库/推荐/助手/考试占位

**Status:** DONE_WITH_CONCERNS  
**Branch:** `lyb`  
**Commit:** `5e9320d` (`feat: add web pages for admin, knowledge, recommend, and assistant`)  
**Date:** 2026-07-24

## Summary

Replaced Task 9 placeholder routes with real pages wired through `src/api/*.ts` to backend paths. UI is simple tables/forms/chat — no visual polish beyond existing layout styles.

| Area | Change |
|------|--------|
| API | `users`, `branches`, `learning`, `exams`, `knowledge`, `agent` modules; `request` exported from `client.ts`; types extended |
| Pages | Users (list+create+delete), Branches (list+create+delete for ADMIN), Learning (list), Exams (list placeholder), Knowledge (list + text ingest), Recommend (query + results), Assistant (chat + optional text/documentId) |
| Router | `App.tsx` routes to real pages; removed `PlaceholderPage.tsx` |
| Styles | Tables, forms, badges, recommend list, chat panel in `index.css` |

## Verification

```bash
cd Web/frontend
npm run build
# PASS — tsc -b && vite build
```

Live backend optional — not exercised in this task (API wiring present; runtime depends on `:8080` / agent).

## Concerns

1. **Live three-role smoke not run** — Backend may be down; pages compile and call correct paths, but browser walkthrough against seed accounts was not verified.
2. **Exams remain list-only** — Per plan, no create/edit/take-exam flows.
3. **Recommend/Assistant need Agent** — Endpoints proxy to Python agent; failures surface as API errors in UI when agent/backend unavailable.
