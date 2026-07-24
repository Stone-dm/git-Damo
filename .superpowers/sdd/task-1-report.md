# Task 1 Report: 基础设施 — docker-compose（MySQL + Milvus）

## Status

**DONE_WITH_CONCERNS**

## Summary

Created Docker Compose infrastructure under `Web/` with MySQL 8.0, Milvus standalone (with etcd + MinIO dependencies), environment template, and README infrastructure documentation. All files match the task brief verbatim. Committed on branch `lyb`.

## Deliverables

| File | Status |
|------|--------|
| `Web/docker-compose.yml` | Created — exact YAML from brief |
| `Web/.env.example` | Created — exact env vars from brief |
| `Web/README.md` | Created — infrastructure section |

## Implementation Details

### docker-compose.yml

- **mysql** (`party-mysql`): MySQL 8.0, port 3306, database `party_school`, user `party` / `party123`, utf8mb4, healthcheck
- **etcd** (`party-etcd`): Milvus metadata store
- **minio** (`party-minio`): Milvus object storage, console on 9001
- **milvus** (`party-milvus`): Milvus v2.3.4 standalone, ports 19530 + 9091
- Named volumes for all persistent data

### .env.example

Documents MySQL, Milvus, DeepSeek, embedding, JWT, and service base URL variables. API keys left empty — never committed.

### README.md

Covers:
- `docker compose up -d` startup instructions
- Waiting for MySQL healthy
- Service port table
- Default account/password table (Docker DB users + future DataSeeder app accounts)
- Stop/cleanup and env var guidance

## Verification

### Commands Run

```bash
cd Web
docker compose up -d
docker compose ps
```

### Result

Docker Desktop is available, but `docker compose up -d` failed twice due to **Docker Hub registry network timeout** (`registry-1.docker.io:443` connection refused/timed out). Partial pull succeeded for `quay.io/coreos/etcd:v3.5.5`; `mysql:8.0`, `minio/minio`, and `milvusdb/milvus` pulls were interrupted.

`docker compose ps` showed no running containers after both attempts.

### Expected vs Actual

| Expected | Actual |
|----------|--------|
| mysql, milvus, etcd, minio all running | No containers started — image pull failure |

**Recommendation:** Re-run `docker compose up -d` when Docker Hub is reachable (or configure a mirror/proxy). Once images are cached, services should start normally.

## Commit

| SHA | Subject |
|-----|---------|
| `26917d2` | chore: add MySQL and Milvus docker-compose for Web scaffold |

Branch: `lyb`

## Self-Review

### Checklist

- [x] All new code under `Web/`
- [x] Business DB MySQL; vector DB Milvus
- [x] DeepSeek API keys only in `.env.example` placeholders — no secrets committed
- [x] Default ports: MySQL 3306, Milvus 19530
- [x] Work on branch `lyb`
- [x] docker-compose.yml matches brief verbatim
- [x] .env.example matches brief verbatim
- [x] README infrastructure section complete
- [x] No docs modified outside `Web/README.md`
- [ ] Container verification — blocked by Docker Hub network (environment issue, not config)

### Concerns

1. **Docker Hub connectivity** — Cannot confirm containers start healthy in this environment. Configuration is correct per brief; verification should be repeated locally with working registry access.
2. **No `.gitignore` for `.env`** — Not in Task 1 scope; later tasks should ensure `.env` is gitignored before developers copy secrets.

## Scope Compliance

- Did not implement Task 2+ (Spring Boot, agent, React, Expo)
- Did not modify docs outside `Web/README.md`
