# Task 11 Report: Expo Mobile 骨架 + 党员主路径

**Status:** DONE_WITH_CONCERNS  
**Branch:** `lyb`  
**Commit:** `8ae4674` (`feat: add Expo mobile app with learning, recommend, and assistant`)  
**Date:** 2026-07-24

## Summary

Scaffolded `Web/mobile/` with Expo Router + TypeScript. Member path: login (SecureStore JWT) → tabs 学习 / 推荐 / 助手 / 我的, calling the same Spring Boot API as Web via `EXPO_PUBLIC_API_BASE_URL`. Admin/secretary can log in; 「我的」 tips them to use Web for admin features; assistant tab remains available.

| Area | Change |
|------|--------|
| App routes | `login`, `(member)/{learning,recommend,assistant,me}`, root auth redirect |
| Auth | `src/auth/token.ts` (expo-secure-store) + `AuthContext` |
| API | `src/api/{client,learning,agent,types}.ts` — `/api/auth/login`, `/api/me`, `/api/learning`, `/api/agent/*` |
| Docs | `Web/mobile/README.md` — LAN IP / Expo Go base URL notes |

## Verification

```bash
cd Web/mobile
npm run typecheck
# PASS — tsc --noEmit
```

Expo Go / simulator device smoke not run in this environment.

## Concerns

1. **Device smoke unverified** — No Expo Go / emulator login walkthrough against live `:8080`.
2. **Recommend/Assistant need Agent** — Same as Web; failures surface when backend/agent unavailable.
3. **Template leftovers** — Unused `components/*` from create-expo-app tabs template remain; not on the member path.
