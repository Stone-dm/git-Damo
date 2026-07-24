### Task 6: Python Agent 鈥?鍋ュ悍妫€鏌?+ 閰嶇疆 + Milvus store

**Files:**
- Create: `Web/agent/requirements.txt`
- Create: `Web/agent/app/config.py`
- Create: `Web/agent/app/main.py`
- Create: `Web/agent/app/api/health.py`
- Create: `Web/agent/app/stores/milvus_store.py`
- Create: `Web/agent/app/rag/chunking.py`
- Create: `Web/agent/app/rag/embeddings.py`
- Test: `Web/agent/tests/test_health.py`

**Interfaces:**
- `GET /health` 鈫?`{ status: "ok" }`
- `MilvusStore.ensure_collections()`
- `MilvusStore.upsert(collection, rows)`
- `MilvusStore.search(collection, vector, filter_expr, top_k) -> list[{text, document_id, score}]`
- Collections: `kb_personal`, `kb_learning`锛涘悜閲忕淮搴︿笌 embedding 妯″瀷涓€鑷达紙鍦?config 涓父閲?`EMBEDDING_DIM`锛岄粯璁?1536锛屽彲閰嶇疆锛?

`requirements.txt` 鍚細`fastapi`銆乣uvicorn`銆乣langchain`銆乣langchain-openai`锛圖eepSeek 鍏煎 OpenAI 鎺ュ彛锛夈€乣pymilvus`銆乣pydantic-settings`銆乣httpx`銆乣pytest`銆乣httpx` for TestClient銆?

- [ ] **Step 1: 鍐?`test_health` 鐢?TestClient 鏂█ `/health` 200**

- [ ] **Step 2: 瀹炵幇 app 涓?milvus_store锛堝惎鍔ㄦ椂 ensure_collections锛?*

- [ ] **Step 3:**

```bash
cd Web/agent
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
pytest tests/test_health.py -v
uvicorn app.main:app --reload --port 8000
```

Expected: health PASS锛汳ilvus 鍙繛鍒?collections 鍒涘缓鎴愬姛銆?

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: scaffold LangChain agent with Milvus store and health API"
```

---


