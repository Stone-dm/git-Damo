### Task 7: Agent 鈥?ingest / recommend / chat

**Files:**
- Create: `Web/agent/app/api/ingest.py`
- Create: `Web/agent/app/api/recommend.py`
- Create: `Web/agent/app/api/chat.py`
- Create: `Web/agent/app/recommend/chain.py`
- Create: `Web/agent/app/assistant/chain.py`
- Test: `Web/agent/tests/test_ingest_recommend.py`锛堝彲鐢ㄥ亣 embedding 鎴?mock锛?

**Interfaces:**

`POST /ingest`
```json
{
  "document_id": "1",
  "kb_type": "PERSONAL",
  "text": "...",
  "user_id": "3",
  "branch_id": "1"
}
```
鈫?chunk 鈫?embed 鈫?upsert 瀵瑰簲 collection

`POST /recommend`
```json
{ "user_id": "3", "branch_id": "1", "query": "杩戞湡閫傚悎瀛︿粈涔? }
```
鈫?妫€绱袱搴?鈫?DeepSeek 鐢熸垚 `{ items: [{ title, reason, document_id? }] }`  
鏃?Key / 妫€绱㈢┖锛氶檷绾ц繑鍥為€氱敤寤鸿 items銆?

`POST /chat`
```json
{
  "user_id": "3",
  "branch_id": "1",
  "role": "MEMBER",
  "message": "璇锋€荤粨杩欎唤鏉愭枡",
  "document_id": "1",
  "text": null,
  "history": [{"role":"user","content":"..."},{"role":"assistant","content":"..."}]
}
```
鈫?鏈?text/document 涓婁笅鏂囧垯鎬荤粨鏁寸悊锛涘惁鍒欏弻搴撴绱㈤棶绛?鈫?`{ reply: "..." }`

DeepSeek 缁?OpenAI 鍏煎瀹㈡埛绔細`base_url=DEEPSEEK_BASE_URL`锛宍api_key=DEEPSEEK_API_KEY`锛宍model=DEEPSEEK_MODEL`銆?

- [ ] **Step 1: 瀹炵幇 chunking锛堟寜瀛楃 500锛宱verlap 50锛?*

- [ ] **Step 2: 瀹炵幇 embeddings 瀹㈡埛绔紙OpenAI compatible锛夛紱鏃?Key 鏃剁敤纭畾鎬т吉鍚戦噺浠呯敤浜庢墦閫氶摼璺紙鏂囨。娉ㄦ槑锛?*

- [ ] **Step 3: 瀹炵幇涓夋潯 API + 闄嶇骇閫昏緫**

- [ ] **Step 4: 鑱旇皟**

```bash
curl -X POST http://localhost:8000/ingest -H "Content-Type: application/json" -d "{\"document_id\":\"1\",\"kb_type\":\"LEARNING\",\"text\":\"鍏氱殑浜屽崄澶ф姤鍛婂涔犺鐐光€︹€",\"user_id\":\"1\",\"branch_id\":\"1\"}"
curl -X POST http://localhost:8000/recommend -H "Content-Type: application/json" -d "{\"user_id\":\"3\",\"branch_id\":\"1\",\"query\":\"鎺ㄨ崘瀛︿範\"}"
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d "{\"user_id\":\"3\",\"branch_id\":\"1\",\"role\":\"MEMBER\",\"message\":\"甯垜鎬荤粨瑕佺偣\",\"text\":\"娴嬭瘯鏂囨。鍐呭鈥︹€"}"
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add agent ingest, recommend, and chat endpoints"
```

---


