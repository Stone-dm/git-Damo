# Task 4 Report: 用户/支部 CRUD + 学习/考试占位 API

**Status:** DONE  
**Branch:** `lyb`  
**Commit:** `8bc91b6` (`feat: add users, branches, learning and exam placeholder APIs`)  
**Date:** 2026-07-24

## Summary

Implemented role-scoped CRUD for users and branches, plus read-only learning/exam placeholder list APIs, on top of Task 3 JWT auth and seed users.

| Area | Files |
|------|--------|
| Branch | `BranchController`, `BranchService`, `BranchRequest`, `BranchView` |
| User | `UserController`, `UserService`, `UserRequest`; `UserRepository.findByBranchIdAndRole` |
| Learning | `LearningContent`, `LearningRepository`, `LearningService`, `LearningController`, `LearningView` |
| Exam | `Exam`, `ExamStatus`, `ExamRepository`, `ExamService`, `ExamController`, `ExamView` |
| Seed | `DataSeeder` — 3 learning items + 1 OPEN exam |
| Test | `branch/BranchControllerTest.java` (`@ActiveProfiles("test")` / H2) |

### API contracts

- `GET/POST/PUT/DELETE /api/users` — ADMIN full; SECRETARY only own-branch `MEMBER`; MEMBER read-self only / no write
- `GET/POST/PUT/DELETE /api/branches` — ADMIN write; SECRETARY/MEMBER read own branch; ADMIN list all
- `GET /api/learning` — ADMIN all; SECRETARY/MEMBER own branch + global (`branchId=null`)
- `GET /api/exams` — ADMIN all; SECRETARY/MEMBER own-branch exams
- `BranchService.assertCanManageBranch` — ADMIN any; SECRETARY same `branchId`; else 403

### Seed extras

- Learning: 党章学习导读 (global), 支部工作条例要点, 廉洁自律准则 (demo branch)
- Exam: 党纪基础知识测验 (`OPEN`, demo branch)

## TDD verification

```bash
# RED (before controllers): FAIL — 500 No static resource api/branches
mvn -q test -Dtest=BranchControllerTest

# GREEN
mvn -q test -Dtest=BranchControllerTest
mvn -q test   # AuthControllerTest + BranchControllerTest + PartySchoolApplicationTests PASS
```

## Concerns

1. **No dedicated UserControllerTest / LearningControllerTest** — brief required Branch permission tests; user/learning/exam covered by implementation + full suite context load only.
2. **MySQL runtime still required** for non-test profile (unchanged from Task 3); tests use H2 only.
3. **MEMBER user list** returns only self (read); write remains forbidden — aligns with SECRETARY/ADMIN-focused management rules.

## Out of scope

- Exam answering / learning detail CRUD
- Knowledge base / Agent APIs (Task 5)
- Frontend
