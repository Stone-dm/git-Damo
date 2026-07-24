# Task 6 Report: Python Agent — 健康检查 + 配置 + Milvus store

**Status:** DONE  
**Branch:** `lyb`  
**Commit:** `57ce830` (`feat: scaffold LangChain agent with Milvus store and health API`)  
**Date:** 2026-07-24

## Summary

Scaffolded `Web/agent` FastAPI app with `/health`, pydantic-settings config, Milvus store (`kb_personal` / `kb_learning`), and RAG helpers (`chunking`, `embeddings`). Startup calls `ensure_collections()` with soft-fail when Milvus is unreachable so `/health` always works. Ingest/recommend/chat deferred to Task 7.

| Area | Files |
|------|--------|
| App | `app/main.py`, `app/config.py`, `app/api/health.py` |
| Store | `app/stores/milvus_store.py` — `ensure_collections`, `upsert`, `search` |
| RAG | `app/rag/chunking.py` (500/50), `app/rag/embeddings.py` (OpenAI-compatible + pseudo vectors) |
| Deps | `requirements.txt`, `pytest.ini`, `.gitignore` |
| Test | `tests/test_health.py` |
| Docs | `Web/README.md` Agent section; `Web/.env.example` + `EMBEDDING_DIM=1536` |

### Interfaces

- `GET /health` → `{ "status": "ok" }`
- `MilvusStore.ensure_collections()` — creates collections + IVF_FLAT/IP index; logs warning on failure
- `MilvusStore.upsert(collection, rows)` / `search(...) -> list[{text, document_id, score}]`
- Collections: `kb_personal` (chunk_id, document_id, user_id, text, embedding), `kb_learning` (…, branch_id, …)
- `EMBEDDING_DIM` default 1536 via settings / env

## Verification

```bash
cd Web/agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pytest tests/test_health.py -v
# PASS — 1 passed
```

During the health test run, Milvus on `localhost:19530` was reachable and collections were created (PyMilvus ORM deprecation warnings only). Soft-fail path remains in place for Docker Hub / Milvus-down environments.

## Concerns

1. **PyMilvus ORM deprecation** — installed `pymilvus` 3.x warns that `connections` / `Collection` / `utility` will be removed in 3.1; migrate to `MilvusClient` later if needed.
2. **No dedicated Milvus unit tests** — upsert/search exercised only via ensure_collections side effect when Milvus is up; full RAG covered in Task 7.
3. **Pseudo embeddings** — empty `EMBEDDING_API_KEY` yields deterministic hash vectors (documented); production needs a real embedding endpoint.
