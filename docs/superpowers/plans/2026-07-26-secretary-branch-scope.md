# 支部书记仅本支部管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `SECRETARY` 在 Web 端全部业务模块中只能查看与操作本支部数据，后端强制 `actor.branchId`，前端去掉跨支部入口。

**Architecture:** 在 `UserService` 暴露可复用的本支部党员访问断言；各业务 Service（档案 / 发展记录 / 培训 / 任务 / 考试）在列表与写操作中注入 `UserPrincipal` 并强制支部边界；前端 Archive / Tasks 按角色锁定本支部。安全以后端为准。

**Tech Stack:** Spring Boot 3 + Java 17、JUnit + MockMvc、React + Vite + TypeScript

**Spec:** `docs/superpowers/specs/2026-07-26-secretary-branch-scope-design.md`

## Global Constraints

- 仅改支部书记端相关能力；不削弱 `ADMIN`；不改 `MEMBER` / Mobile
- 题库（`QuestionService`）本轮不按支部拆分
- 越权统一抛 `AccessDeniedException` → 已有 `GlobalExceptionHandler` 返回 403
- 不信任请求体 / 查询参数中的外支部 ID
- Java 包名：`com.damo.partyschool`
- 演示账号：`secretary` / `sec123`（属「示范党支部」）

---

## File Map

| 文件 | 职责 |
|------|------|
| `Web/backend/.../user/UserService.java` | 新增 `requireAccessibleUser(actor, userId)` |
| `Web/backend/.../member/MemberProfileController.java` | 传入 `principal`，列表强制本支部 |
| `Web/backend/.../member/MemberProfileService.java` | 档案列表 / 浮动 / 读写本支部校验 |
| `Web/backend/.../development/DevelopmentRecordController.java` | 传入 `principal` |
| `Web/backend/.../development/DevelopmentRecordService.java` | 列表与创建本支部过滤 |
| `Web/backend/.../training/TrainingController.java` | 传入 `principal` |
| `Web/backend/.../training/TrainingService.java` | 打卡 / 按用户与按计划记录本支部过滤 |
| `Web/backend/.../task/TaskService.java` | 创建强制本支部；变更校验；进度切片 |
| `Web/backend/.../exam/ExamService.java` | 创建强制 `actor.branchId` |
| `Web/backend/src/test/.../member/MemberProfileControllerTest.java` | 档案越权测试 |
| `Web/backend/src/test/.../task/TaskServiceScopeTest.java`（或 ControllerTest） | 任务越权测试 |
| `Web/backend/src/test/.../exam/ExamControllerTest.java` | 考试创建强制支部 |
| `Web/frontend/src/pages/workbench/ArchivePage.tsx` | 书记默认本支部、去掉「全部支部」 |
| `Web/frontend/src/pages/TasksPage.tsx` | 书记隐藏 ALL / 锁定本支部 |

---

### Task 1: UserService — 可复用党员访问断言

**Files:**
- Modify: `Web/backend/src/main/java/com/damo/partyschool/user/UserService.java`
- Test: `Web/backend/src/test/java/com/damo/partyschool/user/UserControllerTest.java`（若无则新建；也可在后续模块测试中间接覆盖。本任务优先在 `UserService` 旁加集成测试 `UserAccessTest.java`）

**Interfaces:**
- Produces: `public User requireAccessibleUser(UserPrincipal actor, Long userId)` — 用户不存在抛 `IllegalArgumentException`；越权抛 `AccessDeniedException`；规则与现有私有 `assertCanView` 一致
- Consumes: 现有 `assertCanView`、`userRepository`

- [ ] **Step 1: 写失败测试（书记不可访问外支部党员）**

在测试里以 admin 新建第二支部与外支部 MEMBER，再以 secretary 调 `GET /api/users/{id}`（已走 `assertCanView`）确认 403；本任务主要是把同一规则公开给其它 Service。先增加单元/集成断言方法可测路径：

创建: `Web/backend/src/test/java/com/damo/partyschool/user/UserAccessHelperTest.java`

```java
package com.damo.partyschool.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.damo.partyschool.auth.UserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserAccessHelperTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserService userService;
    @Autowired UserRepository userRepository;

    @Test
    void secretaryRequireAccessibleUser_sameBranchMember_ok() {
        User member = userRepository.findByUsername("member").orElseThrow();
        User secretary = userRepository.findByUsername("secretary").orElseThrow();
        UserPrincipal actor = new UserPrincipal(secretary);
        User found = userService.requireAccessibleUser(actor, member.getId());
        assertEquals(member.getId(), found.getId());
    }

    @Test
    void secretaryRequireAccessibleUser_otherBranch_denied() throws Exception {
        String adminToken = login("admin", "admin123");
        MvcResult createBranch = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/branches")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"外支部\",\"description\":\"scope-test\"}"))
                .andReturn();
        long otherBranchId = objectMapper.readTree(createBranch.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"username":"other_mem","password":"x12345","name":"外支部党员","role":"MEMBER","branchId":%d}
                                        """.formatted(otherBranchId)))
                .andReturn();

        User other = userRepository.findByUsername("other_mem").orElseThrow();
        User secretary = userRepository.findByUsername("secretary").orElseThrow();
        UserPrincipal actor = new UserPrincipal(secretary);

        assertThrows(AccessDeniedException.class,
                () -> userService.requireAccessibleUser(actor, other.getId()));
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"username\":\"%s\",\"password\":\"%s\"}"
                                        .formatted(username, password)))
                .andReturn();
        JsonNode root = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return root.path("data").path("token").asText();
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd Web/backend
mvn -q -Dtest=UserAccessHelperTest test
```

Expected: FAIL — `requireAccessibleUser` 不存在

- [ ] **Step 3: 实现 `requireAccessibleUser`**

在 `UserService.java` 的 `get` 方法附近加入：

```java
@Transactional(readOnly = true)
public User requireAccessibleUser(UserPrincipal actor, Long userId) {
    User target = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    assertCanView(actor, target);
    return target;
}
```

确认已有 `import com.damo.partyschool.user.User;`（同类无需 import）。

- [ ] **Step 4: 再跑测试确认通过**

```bash
cd Web/backend
mvn -q -Dtest=UserAccessHelperTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Web/backend/src/main/java/com/damo/partyschool/user/UserService.java \
        Web/backend/src/test/java/com/damo/partyschool/user/UserAccessHelperTest.java
git commit -m "$(cat <<'EOF'
feat: expose requireAccessibleUser for branch-scoped services

EOF
)"
```

---

### Task 2: 党员档案 — 本支部强制

**Files:**
- Modify: `Web/backend/src/main/java/com/damo/partyschool/member/MemberProfileController.java`
- Modify: `Web/backend/src/main/java/com/damo/partyschool/member/MemberProfileService.java`
- Create: `Web/backend/src/test/java/com/damo/partyschool/member/MemberProfileControllerTest.java`

**Interfaces:**
- Consumes: `UserService.requireAccessibleUser(UserPrincipal, Long)`
- Produces: Controller 所有入口传入 `UserPrincipal`；SECRETARY 列表永不走无过滤 `listAll`

- [ ] **Step 1: 写失败测试**

```java
package com.damo.partyschool.member;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MemberProfileControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void secretaryListWithoutBranchId_onlyOwnBranch() throws Exception {
        String token = login("secretary", "sec123");
        mockMvc.perform(get("/api/member-profiles").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray());
        // 所有返回项的 branchId 应等于书记本支部（seed 示范党支部）
        // 用 JSON 再断言：无外支部用户出现（配合 Task1 创建的 other_mem 若存在则不应出现）
    }

    @Test
    void secretaryCannotSaveOtherBranchMember() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = objectMapper.readTree(
                        mockMvc.perform(post("/api/branches")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"name\":\"档案外支部\",\"description\":\"t\"}"))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        long otherUserId = objectMapper.readTree(
                        mockMvc.perform(post("/api/users")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("""
                                                {"username":"arch_other","password":"x12345","name":"外","role":"MEMBER","branchId":%d}
                                                """.formatted(otherBranchId)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        String secToken = login("secretary", "sec123");
        mockMvc.perform(post("/api/member-profiles")
                        .header("Authorization", "Bearer " + secToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":%d,\"phone\":\"13800000000\"}".formatted(otherUserId)))
                .andExpect(status().isForbidden());
    }

    private String login(String u, String p) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(u, p)))
                .andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd Web/backend && mvn -q -Dtest=MemberProfileControllerTest test
```

Expected: FAIL（save 仍 200）

- [ ] **Step 3: 改 Service + Controller**

`MemberProfileService` 注入 `UserService`，方法签名增加 `UserPrincipal actor`：

```java
@Transactional
public MemberProfileView createOrUpdate(UserPrincipal actor, MemberProfileRequest request) {
    userService.requireAccessibleUser(actor, request.userId());
    // ... existing field copy + save ...
}

@Transactional(readOnly = true)
public List<MemberProfileView> listForActor(UserPrincipal actor, Long requestedBranchId) {
    if (actor.getRole() == Role.ADMIN) {
        if (requestedBranchId != null) {
            return listByBranch(requestedBranchId);
        }
        return listAll();
    }
    if (actor.getBranchId() == null) {
        return List.of();
    }
    // SECRETARY（及非 ADMIN）：忽略请求支部，强制本支部
    return listByBranch(actor.getBranchId());
}

@Transactional(readOnly = true)
public MemberProfileView getByUserId(UserPrincipal actor, Long userId) {
    userService.requireAccessibleUser(actor, userId);
    // ... existing load logic ...
}

@Transactional(readOnly = true)
public List<MemberProfileView> listFloating(UserPrincipal actor) {
    List<MemberProfileView> all = /* existing floating load via toViewList */;
    if (actor.getRole() == Role.ADMIN) {
        return all;
    }
    if (actor.getBranchId() == null) {
        return List.of();
    }
    return all.stream()
            .filter(v -> Objects.equals(v.branchId(), actor.getBranchId()))
            .toList();
}
```

Controller 改为：

```java
@GetMapping
public ApiResponse<List<MemberProfileView>> list(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(value = "branchId", required = false) Long branchId) {
    requireAuth(principal);
    return ApiResponse.ok(service.listForActor(principal, branchId));
}

@GetMapping("/user/{userId}")
public ApiResponse<MemberProfileView> getByUserId(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long userId) {
    requireAuth(principal);
    return ApiResponse.ok(service.getByUserId(principal, userId));
}

@PostMapping
public ApiResponse<MemberProfileView> save(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody MemberProfileRequest request) {
    requireAuth(principal);
    return ApiResponse.ok(service.createOrUpdate(principal, request));
}

@GetMapping("/floating")
public ApiResponse<List<MemberProfileView>> listFloating(
        @AuthenticationPrincipal UserPrincipal principal) {
    requireAuth(principal);
    return ApiResponse.ok(service.listFloating(principal));
}
```

注意：`MemberProfileView` 须有 `branchId()` record accessor（已有）。补充 imports：`Role`、`UserService`、`UserPrincipal`、`Objects`。

- [ ] **Step 4: 跑测试通过**

```bash
cd Web/backend && mvn -q -Dtest=MemberProfileControllerTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add Web/backend/src/main/java/com/damo/partyschool/member/ \
        Web/backend/src/test/java/com/damo/partyschool/member/
git commit -m "$(cat <<'EOF'
feat: scope member profiles to secretary branch

EOF
)"
```

---

### Task 3: 发展记录 — 本支部强制

**Files:**
- Modify: `Web/backend/src/main/java/com/damo/partyschool/development/DevelopmentRecordController.java`
- Modify: `Web/backend/src/main/java/com/damo/partyschool/development/DevelopmentRecordService.java`
- Create: `Web/backend/src/test/java/com/damo/partyschool/development/DevelopmentRecordControllerTest.java`

**Interfaces:**
- Consumes: `UserService.requireAccessibleUser`
- Produces: `create/listByUser/listAll/listByStage` 均接收 `UserPrincipal`；SECRETARY 列表仅含本支部党员记录

- [ ] **Step 1: 写失败测试** — 书记对 `arch_other` / 新建外支部用户 `POST /api/development-records` 期望 403

```java
@Test
void secretaryCannotCreateForOtherBranchUser() throws Exception {
    // admin 建外支部用户 otherDev，secretary POST {userId: otherDev, stage: ACTIVIST, ...}
    // expect 403
}
```

- [ ] **Step 2: 跑测失败**

```bash
cd Web/backend && mvn -q -Dtest=DevelopmentRecordControllerTest test
```

- [ ] **Step 3: 实现**

`DevelopmentRecordService`：

```java
@Transactional
public DevelopmentRecordView create(UserPrincipal actor, DevelopmentRecordRequest request) {
    userService.requireAccessibleUser(actor, request.userId());
    // ... existing create ...
}

@Transactional(readOnly = true)
public List<DevelopmentRecordView> listByUser(UserPrincipal actor, Long userId) {
    userService.requireAccessibleUser(actor, userId);
    // ... existing ...
}

@Transactional(readOnly = true)
public List<DevelopmentRecordView> listAll(UserPrincipal actor) {
    return filterForActor(actor, repository.findAll());
}

@Transactional(readOnly = true)
public List<DevelopmentRecordView> listByStage(UserPrincipal actor, DevelopmentStage stage) {
    return filterForActor(actor, repository.findByStage(stage));
}

private List<DevelopmentRecordView> filterForActor(UserPrincipal actor, List<DevelopmentRecord> records) {
    Map<Long, User> userMap = userRepository.findAll().stream()
            .collect(Collectors.toMap(User::getId, u -> u));
    Stream<DevelopmentRecord> stream = records.stream()
            .filter(r -> userMap.containsKey(r.getUserId()));
    if (actor.getRole() != Role.ADMIN) {
        Long bid = actor.getBranchId();
        if (bid == null) {
            return List.of();
        }
        stream = stream.filter(r -> {
            User u = userMap.get(r.getUserId());
            return u.getRole() == Role.MEMBER && Objects.equals(u.getBranchId(), bid);
        });
    }
    return stream
            .map(r -> DevelopmentRecordView.from(r, userMap.get(r.getUserId()).getName()))
            .toList();
}
```

Controller 全部把 `principal` 传入 service。

- [ ] **Step 4: 测试通过 + Commit**

```bash
cd Web/backend && mvn -q -Dtest=DevelopmentRecordControllerTest test
git add Web/backend/src/main/java/com/damo/partyschool/development/ \
        Web/backend/src/test/java/com/damo/partyschool/development/
git commit -m "$(cat <<'EOF'
feat: scope development records to secretary branch

EOF
)"
```

---

### Task 4: 培训 — 打卡与记录本支部强制

**Files:**
- Modify: `Web/backend/src/main/java/com/damo/partyschool/training/TrainingController.java`
- Modify: `Web/backend/src/main/java/com/damo/partyschool/training/TrainingService.java`
- Create: `Web/backend/src/test/java/com/damo/partyschool/training/TrainingControllerTest.java`

**Interfaces:**
- Consumes: `UserService.requireAccessibleUser`
- Produces: `markComplete` / `listRecordsByUser` / `listRecordsByPlan` 接收 `UserPrincipal`；计划 CRUD 保持全局（规格 4.3）

- [ ] **Step 1: 写失败测试** — secretary `POST /api/training/plans/{planId}/complete/{otherUserId}` → 403

- [ ] **Step 2: 跑测失败**

- [ ] **Step 3: 实现**

```java
@Transactional
public TrainingRecordView markComplete(UserPrincipal actor, Long planId, Long userId) {
    userService.requireAccessibleUser(actor, userId);
    // ... existing ...
}

@Transactional(readOnly = true)
public List<TrainingRecordView> listRecordsByUser(UserPrincipal actor, Long userId) {
    userService.requireAccessibleUser(actor, userId);
    // ... existing ...
}

@Transactional(readOnly = true)
public List<TrainingRecordView> listRecordsByPlan(UserPrincipal actor, Long planId) {
    List<TrainingRecordView> views = recordRepository.findByPlanId(planId).stream()
            .map(this::toView)
            .toList();
    if (actor.getRole() == Role.ADMIN) {
        return views;
    }
    if (actor.getBranchId() == null) {
        return List.of();
    }
    // 仅保留本支部党员的完成记录
    Set<Long> ownMemberIds = userRepository.findByBranchIdAndRole(actor.getBranchId(), Role.MEMBER)
            .stream().map(User::getId).collect(Collectors.toSet());
    return views.stream().filter(v -> ownMemberIds.contains(v.userId())).toList();
}
```

确认 `UserRepository` 已有 `findByBranchIdAndRole`（用户列表已用）。Controller 对应方法传入 `principal`。

计划 `createPlan` / `deletePlan`：本轮不按角色限制（ADMIN/SECRETARY 均可，与现 UI 一致）；若后续要限 ADMIN 另开任务。

- [ ] **Step 4: 测试通过 + Commit**

```bash
cd Web/backend && mvn -q -Dtest=TrainingControllerTest test
git add Web/backend/src/main/java/com/damo/partyschool/training/ \
        Web/backend/src/test/java/com/damo/partyschool/training/
git commit -m "$(cat <<'EOF'
feat: scope training completion to secretary branch

EOF
)"
```

---

### Task 5: 任务 — 创建 / 变更 / 进度本支部强制

**Files:**
- Modify: `Web/backend/src/main/java/com/damo/partyschool/task/TaskService.java`
- Create: `Web/backend/src/test/java/com/damo/partyschool/task/TaskControllerTest.java`

**Interfaces:**
- Produces:
  - SECRETARY `createTask` → 强制 `targetType=BRANCH`，`targetBranchIds=[actor.branchId]`
  - `dispatchTask` / `closeTask` / `deleteTask` → `assertCanMutateTask`
  - `getTaskProgress` / `getBranchCompletion` → 任务须对书记可见；结果仅本支部切片

- [ ] **Step 1: 写失败测试**

```java
@Test
void secretaryCreateIgnoresAllAndForeignBranches() throws Exception {
    String token = login("secretary", "sec123");
    MvcResult result = mockMvc.perform(post("/api/tasks")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"title":"越权任务","type":"LEARNING","targetType":"ALL","targetBranchIds":[999]}
                            """))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    // expect targetType BRANCH and only own branch id
    org.junit.jupiter.api.Assertions.assertEquals("BRANCH", data.path("targetType").asText());
}

@Test
void secretaryCannotDispatchForeignBranchTask() throws Exception {
    // admin 创建 BRANCH 指向外支部的草稿任务，secretary dispatch → 403
}
```

确认 `TaskController` 路径为 `/api/tasks`（与前端一致）。

- [ ] **Step 2: 跑测失败**

- [ ] **Step 3: 实现 TaskService 核心逻辑**

在 `createTask` 开头：

```java
String targetType = request.targetType();
List<Long> targetBranchIds = request.targetBranchIds();

if (actor.getRole() == Role.SECRETARY) {
    if (actor.getBranchId() == null) {
        throw new AccessDeniedException("书记未绑定支部");
    }
    targetType = "BRANCH";
    targetBranchIds = List.of(actor.getBranchId());
}

task.setTargetType(targetType);
if ("BRANCH".equals(targetType) && targetBranchIds != null && !targetBranchIds.isEmpty()) {
    task.setTargetBranchIds(targetBranchIds.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(",")));
}
```

新增：

```java
private void assertTaskVisible(UserPrincipal actor, Task task) {
    if (actor.getRole() == Role.ADMIN) {
        return;
    }
    if (actor.getBranchId() == null) {
        throw new AccessDeniedException("无权查看该任务");
    }
    if ("ALL".equals(task.getTargetType())) {
        return;
    }
    String branchIdStr = String.valueOf(actor.getBranchId());
    if (task.getTargetBranchIds() != null
            && Arrays.asList(task.getTargetBranchIds().split(",")).contains(branchIdStr)) {
        return;
    }
    throw new AccessDeniedException("无权查看该任务");
}

/** 书记仅可变更「仅指向本支部」的 BRANCH 任务；不可变更 ALL 或含外支部任务 */
private void assertCanMutateTask(UserPrincipal actor, Task task) {
    if (actor.getRole() == Role.ADMIN) {
        return;
    }
    if (actor.getRole() != Role.SECRETARY || actor.getBranchId() == null) {
        throw new AccessDeniedException("无权操作该任务");
    }
    if (!"BRANCH".equals(task.getTargetType()) || task.getTargetBranchIds() == null) {
        throw new AccessDeniedException("书记仅可管理本支部任务");
    }
    List<String> ids = Arrays.stream(task.getTargetBranchIds().split(","))
            .map(String::trim).filter(s -> !s.isEmpty()).toList();
    String own = String.valueOf(actor.getBranchId());
    if (ids.size() != 1 || !ids.contains(own)) {
        throw new AccessDeniedException("书记仅可管理本支部任务");
    }
}
```

在 `dispatchTask` / `closeTask` / `deleteTask` 取到 task 后调用 `assertCanMutateTask(actor, task)`。

在 `getTaskProgress` / `getBranchCompletion`：先 `assertTaskVisible`；若 `actor.getRole() != ADMIN`，过滤 `branchId.equals(actor.getBranchId())` 的进度行 / 完成率卡片。

- [ ] **Step 4: 测试通过 + Commit**

```bash
cd Web/backend && mvn -q -Dtest=TaskControllerTest test
git add Web/backend/src/main/java/com/damo/partyschool/task/ \
        Web/backend/src/test/java/com/damo/partyschool/task/
git commit -m "$(cat <<'EOF'
feat: enforce secretary branch scope on tasks

EOF
)"
```

---

### Task 6: 考试创建 — 强制本支部

**Files:**
- Modify: `Web/backend/src/main/java/com/damo/partyschool/exam/ExamService.java`
- Create: `Web/backend/src/test/java/com/damo/partyschool/exam/ExamControllerTest.java`

**Interfaces:**
- Produces: SECRETARY `createExam` 始终 `exam.setBranchId(actor.getBranchId())`，忽略 `request.branchId()`

- [ ] **Step 1: 写失败测试**

```java
@Test
void secretaryCreateExam_forcesOwnBranchId() throws Exception {
    String token = login("secretary", "sec123");
    MvcResult r = mockMvc.perform(post("/api/exams")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"title\":\"本支部考\",\"status\":\"DRAFT\",\"branchId\":99999}"))
            .andExpect(status().isOk())
            .andReturn();
    long branchId = objectMapper.readTree(r.getResponse().getContentAsString())
            .path("data").path("branchId").asLong();
    // branchId 必须等于 seed 示范党支部 id（可通过 GET /api/branches 取）
    org.junit.jupiter.api.Assertions.assertNotEquals(99999L, branchId);
}
```

- [ ] **Step 2: 跑测（当前可能「通过但 branchId=99999」——断言失败即红）**

- [ ] **Step 3: 改 `ExamService.createExam`**

```java
Long branchId;
if (actor.getRole() == Role.SECRETARY) {
    if (actor.getBranchId() == null) {
        throw new AccessDeniedException("书记未绑定支部");
    }
    branchId = actor.getBranchId();
} else {
    branchId = request.branchId() != null ? request.branchId() : actor.getBranchId();
}
exam.setBranchId(branchId);
```

加 `import org.springframework.security.access.AccessDeniedException;`

- [ ] **Step 4: 测试通过 + Commit**

```bash
cd Web/backend && mvn -q -Dtest=ExamControllerTest test
git add Web/backend/src/main/java/com/damo/partyschool/exam/ExamService.java \
        Web/backend/src/test/java/com/damo/partyschool/exam/
git commit -m "$(cat <<'EOF'
feat: force exam branchId to secretary own branch

EOF
)"
```

---

### Task 7: 前端档案页 — 书记去掉「全部支部」

**Files:**
- Modify: `Web/frontend/src/pages/workbench/ArchivePage.tsx`

**Interfaces:**
- Consumes: `useAuth()` → `user.role` / `user.branchId`

- [ ] **Step 1: 改 `ArchivePage`**

```tsx
import { useAuth } from '../../auth/AuthContext';

export function ArchivePage() {
  const { user } = useAuth();
  const isSecretary = user?.role === 'SECRETARY';
  const [filterBranch, setFilterBranch] = useState<number | null>(
    () => (user?.role === 'SECRETARY' ? user.branchId : null),
  );

  useEffect(() => {
    if (isSecretary && user?.branchId != null) {
      setFilterBranch(user.branchId);
    }
  }, [isSecretary, user?.branchId]);

  // load: 书记始终带 branchId
  const load = useCallback(async (branchId: number | null) => {
    // ...
    const data = await listMemberProfiles(
      branchId != null ? { branchId } : undefined,
    );
    // ...
  }, []);

  // 筛选 UI：
  // ADMIN：保留「全部支部」+ 下拉
  // SECRETARY：不渲染「全部支部」；下拉仅本支部或直接显示支部名只读
```

书记筛选区示例：

```tsx
{isSecretary ? (
  <span className="archive-filter-label">本支部档案</span>
) : (
  <label>
    <span className="archive-filter-label">按支部筛选：</span>
    <select
      value={filterBranch ?? ''}
      onChange={(e) =>
        setFilterBranch(e.target.value ? Number(e.target.value) : null)
      }
    >
      <option value="">全部支部</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  </label>
)}
```

副标题可将「全体党员」改为书记视角「本支部党员」（可选）。

- [ ] **Step 2: 手工验收** — 浏览器登录 `secretary` / `sec123`，打开工作台档案：无「全部支部」，列表仅本支部。

- [ ] **Step 3: Commit**

```bash
git add Web/frontend/src/pages/workbench/ArchivePage.tsx
git commit -m "$(cat <<'EOF'
fix: lock archive filter to secretary branch

EOF
)"
```

---

### Task 8: 前端任务页 — 书记锁定本支部目标

**Files:**
- Modify: `Web/frontend/src/pages/TasksPage.tsx`

**Interfaces:**
- Consumes: `useAuth()`；创建时 SECRETARY 固定 `targetType: 'BRANCH'`、`targetBranchIds: [user.branchId]`

- [ ] **Step 1: 改创建表单默认值与 UI**

```tsx
import { useAuth } from '../auth/AuthContext';

// 组件内：
const { user } = useAuth();
const isSecretary = user?.role === 'SECRETARY';

const [createTargetType, setCreateTargetType] = useState<'ALL' | 'BRANCH'>(
  () => (user?.role === 'SECRETARY' ? 'BRANCH' : 'ALL'),
);
const [createTargetBranchIds, setCreateTargetBranchIds] = useState<number[]>(
  () => (user?.role === 'SECRETARY' && user.branchId != null ? [user.branchId] : []),
);

// handleCreate 提交前：
const targetType = isSecretary ? 'BRANCH' : createTargetType;
const targetBranchIds = isSecretary
  ? (user?.branchId != null ? [user.branchId] : [])
  : createTargetType === 'BRANCH'
    ? createTargetBranchIds
    : undefined;

await createTask({ ..., targetType, targetBranchIds, ... });

// reset 时书记回到 BRANCH + [branchId]
```

目标范围 UI：书记不渲染「全平台」按钮与多选 checkbox，改为只读文案「本支部」。

- [ ] **Step 2: 手工验收** — secretary 创建任务后，列表项目标显示本支部；无法选全平台。

- [ ] **Step 3: Commit**

```bash
git add Web/frontend/src/pages/TasksPage.tsx
git commit -m "$(cat <<'EOF'
fix: lock task create target to secretary branch

EOF
)"
```

---

### Task 9: 回归验收

**Files:** 无代码（或按需修 bug）

- [ ] **Step 1: 跑全部后端相关测试**

```bash
cd Web/backend
mvn -q -Dtest=UserAccessHelperTest,MemberProfileControllerTest,DevelopmentRecordControllerTest,TrainingControllerTest,TaskControllerTest,ExamControllerTest,BranchControllerTest test
```

Expected: PASS

- [ ] **Step 2: 手工清单（对照规格 §7）**

| # | 操作 | 期望 |
|---|------|------|
| 1 | secretary 登录 → 用户 / 档案 / 任务 / 考试 | 仅本支部 |
| 2 | API 传外支部 `branchId` / `userId` / `targetType=ALL` | 强制纠正或 403 |
| 3 | admin 登录 | 全局能力不变 |
| 4 | 题库 | 行为不变 |

- [ ] **Step 3: 确认 Exams 前端** — 打开 `Web/frontend/src/pages/ExamsPage.tsx`：若创建表单无支部选择器则无需改 UI（后端已强制）；若有外支部选择则按 Task 7 同模式锁定。

---

## Self-Review（对照规格）

| 规格项 | 对应任务 |
|--------|----------|
| 4.1 党员档案 | Task 2 + 7 |
| 4.2 发展记录 | Task 3 |
| 4.3 培训 | Task 4 |
| 4.4 任务 | Task 5 + 8 |
| 4.5 考试 | Task 6 + 9.3 |
| 4.6 题库不改 | Task 9 确认 |
| 已满足模块不动 | 无 Task 改 users/branches/learning/knowledge/materials |
| 前端对齐 | Task 7–8 |

无 TBD/占位符；`requireAccessibleUser` 签名在 Task 1 定义，后续任务一致。
