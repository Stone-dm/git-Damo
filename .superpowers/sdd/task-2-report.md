# Task 2 Report: Spring Boot 工程骨架 + 统一响应/安全配置

**Status:** DONE_WITH_CONCERNS  
**Branch:** `lyb`  
**Commits:** `d534132` (scaffold), `162a4dc` (gitignore target/)  
**Date:** 2026-07-24

## Summary

Implemented the Spring Boot 3.2.5 / Java 17 backend skeleton under `Web/backend` per the Task 2 brief:

| File | Purpose |
|------|---------|
| `Web/backend/pom.xml` | Parent `spring-boot-starter-parent` 3.2.5; deps: web, data-jpa, security, validation, mysql-connector-j, jjwt 0.12.5 (api/impl/jackson), lombok, starter-test, spring-security-test |
| `PartySchoolApplication.java` | `@SpringBootApplication` entry |
| `application.yml` | Port 8080; MySQL/JPA/JWT/agent settings verbatim from brief |
| `ApiResponse.java` | Record `{ code, message, data }` with `ok` / `fail` factories |
| `GlobalExceptionHandler.java` | `IllegalArgumentException`→400, `AccessDeniedException`→403, other→500 via `ApiResponse.fail` |
| `CorsConfig.java` | `CorsConfigurationSource` allowing `http://localhost:5173` |
| `PartySchoolApplicationTests.java` | `@SpringBootTest` context-load test |

JWT login, users, and agent wiring were **not** implemented (Task 3+).

## Verification

```bash
cd Web/backend
mvn -q -DskipTests compile   # PASS (exit 0)
mvn -q test -Dtest=PartySchoolApplicationTests  # FAIL (exit 1)
```

**Test failure root cause:** ApplicationContext failed to start because Hibernate could not obtain JDBC metadata / dialect — MySQL was not reachable on `localhost:3306`.

Attempted `docker compose -f Web/docker-compose.yml up -d mysql`; pull of `mysql:8.0` failed with Docker Hub registry timeout (`registry-1.docker.io` connect failure). Same Hub connectivity concern noted in Task 1.

Code is compilable and committed; full context-load PASS requires a running MySQL matching `application.yml` defaults (`party` / `party123` / `party_school`).

## Concerns

1. **MySQL unavailable** — context-load test cannot PASS until Docker Hub is reachable or MySQL is otherwise available locally.
2. **No `SecurityConfig` yet** — dependency is on classpath; default Spring Security auto-config applies. Explicit JWT/filter chain is Task 3.
3. **CORS bean only** — `CorsConfigurationSource` is registered; enabling CORS on the security filter chain awaits Task 3 `SecurityConfig`.

## Out of scope (by design)

- JWT login / users / branches / seed accounts
- Agent client
- Frontend
