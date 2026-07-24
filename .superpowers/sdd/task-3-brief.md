### Task 3: 鐢ㄦ埛/鏀儴瀹炰綋 + 鐧诲綍 JWT + 绉嶅瓙璐﹀彿

**Files:**
- Create: `Web/backend/src/main/java/com/damo/partyschool/user/Role.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/user/User.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/user/UserRepository.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/branch/Branch.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/branch/BranchRepository.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/auth/*`
- Create: `Web/backend/src/main/java/com/damo/partyschool/config/SecurityConfig.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/seed/DataSeeder.java`
- Test: `Web/backend/src/test/java/com/damo/partyschool/auth/AuthControllerTest.java`

**Interfaces:**
- Produces:
  - `POST /api/auth/login` body `{ username, password }` 鈫?`{ token, user: { id, username, name, role, branchId } }`
  - `GET /api/me` 鈫?褰撳墠鐢ㄦ埛
  - Roles: `ADMIN` / `SECRETARY` / `MEMBER`
- Seed users: `admin/admin123`銆乣secretary/sec123`銆乣member/mem123`锛堝悓涓€婕旂ず鏀儴锛?

- [ ] **Step 1: 鍐欏け璐ユ祴璇?`AuthControllerTest`**

浣跨敤 `@SpringBootTest` + `@AutoConfigureMockMvc`锛? 
1) 鐢ㄧ瀛愯处鍙风櫥褰曟湡鏈?200 涓旀湁 `data.token`锛? 
2) 閿欒瀵嗙爜鏈熸湜闈?0 code 鎴?401锛? 
3) 甯?token 璋?`/api/me` 杩斿洖 `MEMBER`/`ADMIN` 绛夈€?

- [ ] **Step 2: 璺戞祴璇曠‘璁ゅけ璐?*

```bash
mvn -q test -Dtest=AuthControllerTest
```

Expected: FAIL锛堟帶鍒跺櫒涓嶅瓨鍦級

- [ ] **Step 3: 瀹炵幇瀹炰綋涓?JWT**

- `User` 瀛楁锛歚id, username, passwordHash, name, role(Role enum), branchId(Long nullable for ADMIN)`
- `Branch`锛歚id, name, description`
- `JwtService`锛氱敓鎴?瑙ｆ瀽 subject=username锛宑laims 鍚?`uid, role, branchId`
- `JwtAuthFilter`锛欰uthorization Bearer
- `SecurityConfig`锛氭斁琛?`/api/auth/login`銆乣/actuator/health`锛堣嫢鏃?actuator 鍒欎粎 login锛夛紱鍏朵綑闇€璁よ瘉锛涚鐢?CSRF锛涙棤 session
- `AuthController` + `DataSeeder`锛坄ApplicationRunner`锛屼粎褰撳簱绌烘椂鎻掑叆锛?

瀵嗙爜鐢?`BCryptPasswordEncoder`銆?

- [ ] **Step 4: 璺戞祴璇曡嚦 PASS**

```bash
mvn -q test -Dtest=AuthControllerTest
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Web/backend
git commit -m "feat: add JWT login, roles, and seed users"
```

---


