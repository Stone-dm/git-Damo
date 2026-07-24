### Task 4: 鐢ㄦ埛/鏀儴 CRUD + 瀛︿範/鑰冭瘯鍗犱綅 API

**Files:**
- Create: `user/UserController.java`, `UserService.java`
- Create: `branch/BranchController.java`, `BranchService.java`
- Create: `learning/*`, `exam/*`
- Test: `Web/backend/src/test/java/com/damo/partyschool/branch/BranchControllerTest.java`

**Interfaces:**
- `GET/POST/PUT/DELETE /api/users` 鈥?ADMIN 鍏ㄩ噺锛汼ECRETARY 浠呮湰鏀儴 MEMBER
- `GET/POST/PUT/DELETE /api/branches` 鈥?浠?ADMIN 鍐欙紱SECRETARY/MEMBER 鍙鑷繁鏀儴
- `GET /api/learning` 鈥?鎸夎鑹茶繃婊わ紙ADMIN 鍏紱SECRETARY 鏈敮閮?鍏ㄥ眬锛汳EMBER 鍙鑼冨洿锛?
- `GET /api/exams` 鈥?鍗犱綅鍒楄〃
- LearningContent锛歚id, title, summary, branchId(nullable=鍏ㄥ眬), createdAt`
- Exam锛歚id, title, status(DRAFT/OPEN), branchId`

- [ ] **Step 1: 鍐?Branch 鏉冮檺娴嬭瘯**

SECRETARY 涓嶈兘鍒涘缓鍏朵粬鏀儴锛汚DMIN 鍙互鍒涘缓鏀儴銆?

- [ ] **Step 2: 瀹炵幇 Service 灞傛潈闄愭牎楠?*

缁熶竴鏂规硶绀轰緥锛?

```java
public void assertCanManageBranch(User actor, Long branchId) {
  if (actor.getRole() == Role.ADMIN) return;
  if (actor.getRole() == Role.SECRETARY && Objects.equals(actor.getBranchId(), branchId)) return;
  throw new AccessDeniedException("鏃犳潈鎿嶄綔璇ユ敮閮?);
}
```

- [ ] **Step 3: DataSeeder 澧炲姞 2锝? 鏉?learning 涓?1 鏉?exam**

- [ ] **Step 4: 娴嬭瘯 PASS 鍚?Commit**

```bash
git commit -m "feat: add users, branches, learning and exam placeholder APIs"
```

---


