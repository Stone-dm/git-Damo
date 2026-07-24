### Task 11: Expo Mobile 楠ㄦ灦 + 鍏氬憳涓昏矾寰?

**Files:**
- Create: `Web/mobile/` Expo Router TypeScript 搴旂敤
- Create: `app/login.tsx`
- Create: `app/(member)/_layout.tsx`锛坱abs锛氬涔?鎺ㄨ崘/鍔╂墜/鎴戠殑锛?
- Create: `app/(member)/learning.tsx`
- Create: `app/(member)/recommend.tsx`
- Create: `app/(member)/assistant.tsx`
- Create: `app/(member)/me.tsx`
- Create: `src/api/client.ts`, `src/auth/token.ts`锛坋xpo-secure-store锛?

**Interfaces:**
- `EXPO_PUBLIC_API_BASE_URL` 鎸囧悜鐢佃剳灞€鍩熺綉 IP 鐨?`:8080`锛圧EADME 鍐欐槑锛?
- 绠＄悊鍛?涔﹁鐧诲綍鍚?me 椤垫彁绀轰娇鐢?Web 绠＄悊绔紱浠嶅彲杩涘叆鍔╂墜 tab

- [ ] **Step 1:**

```bash
cd Web
npx create-expo-app@latest mobile --template tabs
# 鎴栧畼鏂?expo-router template锛涗繚璇?TypeScript
cd mobile
npx expo install expo-secure-store
```

鑻ラ粯璁ゆā鏉夸笉鏄?expo-router锛屾寜 Expo Router 鏂囨。鏀规垚 `app/` 鐩綍璺敱銆?

- [ ] **Step 2: 瀹炵幇鐧诲綍涓庡洓涓?Tab 璋冨悓涓€ API**

- [ ] **Step 3: Expo Go / 妯℃嫙鍣ㄩ獙璇佺櫥褰曘€佸涔犲垪琛ㄣ€佹帹鑽愩€佸姪鎵?*

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add Expo mobile app with learning, recommend, and assistant"
```

---


