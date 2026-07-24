# Task 3 Report: 用户/支部实体 + 登录 JWT + 种子账号

**Status:** DONE_WITH_CONCERNS  
**Branch:** `lyb`  
**Commit:** `4c3b71d` (`feat: add JWT login, roles, and seed users`)  
**Date:** 2026-07-24

## Summary

Implemented User/Branch JPA entities, JWT login (`POST /api/auth/login`), current-user endpoint (`GET /api/me`), Spring Security filter chain, BCrypt passwords, and empty-DB seed accounts on the Task 2 Spring Boot skeleton.

| Area | Files |
|------|--------|
| User | `user/Role.java`, `User.java`, `UserRepository.java` |
| Branch | `branch/Branch.java`, `BranchRepository.java` |
| Auth | `auth/AuthController`, `AuthService`, `JwtService`, `JwtAuthFilter`, `UserPrincipal`, DTOs |
| Security | `config/SecurityConfig.java` — permit login (+ `/actuator/health`), CSRF off, STATELESS, JWT filter |
| Seed | `seed/DataSeeder.java` — demo branch + `admin`/`secretary`/`member` when `users` empty |
| Test | `auth/AuthControllerTest.java` + `src/test/resources/application-test.yml` (H2) |

### API contracts

- `POST /api/auth/login` `{ username, password }` → `ApiResponse` with `data.token` and `data.user { id, username, name, role, branchId }`
- `GET /api/me` (Bearer JWT) → current user view
- JWT subject = username; claims: `uid`, `role`, `branchId`
- Roles: `ADMIN` / `SECRETARY` / `MEMBER`
- Seed (same demo branch for secretary/member; admin `branchId=null`):
  - `admin` / `admin123`
  - `secretary` / `sec123`
  - `member` / `mem123`

Wrong password → HTTP **401** + `ApiResponse.code=401`.

## TDD verification

```bash
# RED (before implementation): FAIL — 403 CSRF / no controller
mvn -q test -Dtest=AuthControllerTest

# GREEN (after implementation): PASS
mvn -q test -Dtest=AuthControllerTest
mvn -q test   # AuthControllerTest + PartySchoolApplicationTests PASS
```

## Test profile note (H2 — test only)

**Production `application.yml` still uses MySQL** (unchanged).

Local `MySQL83` was listening on `3306`, but user `party`/`party123` was **not** configured (`Access denied`). Docker Compose `party-mysql` was not running (empty `docker compose ps`; Hub pull historically timed out in Task 1/2).

Therefore AuthControllerTest uses:

- `@ActiveProfiles("test")`
- `src/test/resources/application-test.yml` → H2 in-memory (`MODE=MySQL`)
- `com.h2database:h2` with **`<scope>test</scope>`** only in `pom.xml`
- `PartySchoolApplicationTests` also `@ActiveProfiles("test")` so context-load does not require MySQL

**Do not treat H2 as a production datasource.** Runtime/app startup against MySQL still needs a matching DB (`party` / `party123` / `party_school`) via Docker Compose or local grants.

## Concerns

1. **MySQL not ready for runtime** — production profile cannot start until DB credentials/database exist; tests deliberately bypass this with H2.
2. **Default Spring Security password warning** — `UserDetailsServiceAutoConfiguration` still logs a generated password because auth is JWT-only (no form login `UserDetailsService`). Harmless but noisy.
3. **No AuthenticationEntryPoint JSON** — unauthenticated `/api/me` may return empty Spring Security 401/403 body rather than `ApiResponse`; login failures are covered via `AuthException` → 401 JSON.
4. **Default JWT secret** — `change-me-to-a-long-random-string` remains the default; must be overridden in real deployments.

## Out of scope

- Agent client / frontend / role-based method security beyond authenticated access
- Creating MySQL users/databases on the host service
