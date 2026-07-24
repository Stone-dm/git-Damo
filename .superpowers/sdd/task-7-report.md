# Task 7 Report: Agent — ingest / recommend / chat

**Status:** DONE  
**Branch:** `lyb`  
**Commit:** `37c9b27` (`feat: add agent ingest, recommend, and chat endpoints`)  
**Date:** 2026-07-24

## Summary

Implemented Agent `/ingest`, `/recommend`, and `/chat` on the FastAPI app from Task 6. Chunking (500/50) and embeddings (OpenAI-compatible + pseudo vectors) were already present; this task wires them into ingest, adds DeepSeek OpenAI-compatible client, recommend/assistant chains with degradation, and registers routes.

| Area | Files |
|------|--------|
| API | `app/api/ingest.py`, `recommend.py`, `chat.py` — registered in `main.py` |
| Chains | `app/recommend/chain.py`, `app/assistant/chain.py` |
| LLM | `app/llm/deepseek.py` — `base_url` / `api_key` / `model` from settings |
| Test | `tests/test_ingest_recommend.py` (mocked Milvus + DeepSeek) |
| Deps | `openai>=1.0.0` added to `requirements.txt` |

### Interfaces

- `POST /ingest` → chunk → embed → upsert `kb_personal` / `kb_learning` → `{ status, chunks, collection }`
- `POST /recommend` → dual-KB search → DeepSeek JSON items; **no Key or empty hits** → generic suggestion `items`
- `POST /chat` → with `text` / `document_id` context: summarize; else dual-KB Q&A → `{ reply }`; degrades offline without Key / empty retrieval

## Verification

```bash
cd Web/agent
.venv\Scripts\python.exe -m pytest tests/test_ingest_recommend.py tests/test_health.py -v
# PASS — 7 passed

# Smoke (uvicorn :8000): health / recommend / chat degrade OK; ingest upserted 1 chunk to kb_learning
```

## Concerns

1. **Console encoding** — PowerShell may garble Chinese in degrade replies; JSON payloads are UTF-8 fine.
2. **Milvus required for real ingest** — tests mock store; live ingest needs Milvus up (worked in local smoke).
3. **LLM JSON parsing** — recommend relies on best-effort JSON extraction from DeepSeek; malformed output falls back to generic items.
4. **document_id-only chat** — retrieves chunks via filtered search; if Milvus empty, falls through to Q&A degrade path.
