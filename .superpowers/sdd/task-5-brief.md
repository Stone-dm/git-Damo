### Task 5: 鐭ヨ瘑搴撳厓鏁版嵁 API + AgentClient 杞彂楠ㄦ灦

**Files:**
- Create: `knowledge/KbDocument.java`锛堝瓧娈碉細`id, title, kbType(PERSONAL|LEARNING), ownerUserId, branchId, sourceName, syncStatus(PENDING|SYNCED|FAILED), createdAt`锛?
- Create: `knowledge/KnowledgeService.java`, `KnowledgeController.java`
- Create: `agent/AgentClient.java`锛圵ebClient/RestClient锛?
- Create: `agent/AgentController.java`
- Create DTOs: `RecommendRequest`, `ChatRequest`, `IngestPayload`

**Interfaces:**
- `POST /api/knowledge/upload` body: `{ title, kbType, content, sourceName }`  
  鈫?鍐?MySQL `PENDING` 鈫?璋?Agent `/ingest` 鈫?鎴愬姛鍒?`SYNCED`
- `GET /api/knowledge` 鎸夋潈闄愯繃婊?
- `POST /api/agent/recommend` 鈫?Agent `/recommend`
- `POST /api/agent/chat` body: `{ message, documentId?, text?, history? }` 鈫?Agent `/chat`
- AgentClient 鏂规硶锛?
  - `void ingest(IngestPayload payload)`
  - `RecommendResponse recommend(RecommendPayload payload)`
  - `ChatResponse chat(ChatPayload payload)`

Agent 涓嶅彲鐢ㄦ椂锛欿nowledge 鏍囪 `FAILED`锛況ecommend/chat 杩斿洖 `ApiResponse.fail(503, "鏅鸿兘浣撴湇鍔℃殏涓嶅彲鐢?)`銆?

- [ ] **Step 1: 瀹炵幇瀹炰綋涓?upload锛堝彲鍏?Mock AgentClient 杩斿洖鎴愬姛锛?*

- [ ] **Step 2: 瀹炵幇鐪熷疄 RestClient 鎸囧悜 `app.agent.base-url`**

- [ ] **Step 3: 鎵嬪姩鐢?curl 娴?upload锛圓gent 鏈捣鏃舵湡鏈?FAILED 鎴?503锛岃涓虹鍚堜笂鏂囷級**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add knowledge metadata APIs and agent client forwarding"
```

---


