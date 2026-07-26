# 支部书记仅本支部管理 — 设计说明

**日期：** 2026-07-26  
**范围：** 支部书记端（`SECRETARY`）全端收紧  
**方案：** 后端服务层统一校验 + 前端对齐（方案 A）

## 1. 背景与目标

规格已约定支部书记「仅本支部」。当前用户 / 支部 / 学习 / 知识库 / 资料列表等已按 `actor.branchId` 收紧，但工作台档案、发展记录、培训、任务写操作与进度、考试创建等路径仍可能跨支部。

**目标：** SECRETARY 在 Web 管理端可见的全部业务模块中，只能查看与操作本支部数据；不信任前端传入的支部参数。

**非目标：** 不改角色模型；不改 MEMBER 端；不削弱 ADMIN 全局能力；不做 AOP 统一拦截器；题库保持全局共享。

## 2. 原则

1. JWT / `UserPrincipal.branchId` 为书记的支部边界；写操作强制绑定该值。
2. 复用现有 `BranchService.assertCanManageBranch` 与 `UserService` 的查看/写入断言模式。
3. 已正确收紧的模块本轮不改动。
4. 前端仅做体验对齐（隐藏跨支部入口）；安全以后端为准。

## 3. 已满足（保持不变）

| 模块 | 现状 |
|------|------|
| 用户管理 | 列表仅本支部 MEMBER；写操作 `assertCanWrite` + 本支部 |
| 支部管理 | SECRETARY 只读本支部；写仅 ADMIN；菜单不展示 |
| 学习内容 | 本支部 + 全局（`branchId` null） |
| 知识库 | PERSONAL / LEARNING 可见范围已按支部过滤 |
| 资料列表 / 上传 | 列表本支部+全局；上传写入 `actor.branchId` |
| 考试列表 | 按本支部过滤 |
| 任务列表 | `ALL` 或目标含本支部 |

## 4. 后端补齐

### 4.1 党员档案（`MemberProfileService` / Controller）

| 操作 | SECRETARY 行为 |
|------|----------------|
| 列表 | 忽略请求中的外支部 `branchId`；始终 `listByBranch(actor.branchId)`；禁止「全部支部」等价未过滤列表 |
| 浮动党员 | 仅返回用户 `branchId == actor.branchId` 的记录 |
| 按 userId 读 / 保存 | 目标用户须为本支部 MEMBER（复用或对齐 `UserService` 查看规则） |

### 4.2 发展记录（`DevelopmentRecordService`）

- 列表：仅本支部党员相关记录。
- 按 `userId` 查询 / 创建：目标用户须为本支部 MEMBER，否则 `AccessDeniedException`。

### 4.3 培训（`TrainingService`）

- 培训计划本身可为全局（与现有一致）；本轮不按支部拆计划。
- 按用户查询完成情况、`markComplete(planId, userId)`：目标用户须为本支部 MEMBER，否则拒绝。
- ADMIN 全局能力不变。

### 4.4 任务（`TaskService`）

| 操作 | SECRETARY 行为 |
|------|----------------|
| 创建 | 强制 `targetType = BRANCH`，`targetBranchIds = [actor.branchId]`；拒绝 `ALL` 与其它支部 ID |
| 派发 / 关闭 / 删除 | 任务须对书记可见，且目标为本支部相关（含历史上错误创建的外支部任务则拒绝变更） |
| 进度 / 支部完成率 | 仅返回本支部成员与本支部完成数据；对 `ALL` 任务也只暴露本支部切片 |

### 4.5 考试（`ExamService`）

- 创建：强制 `branchId = actor.branchId`，忽略请求体中的其它支部 ID。

### 4.6 题库（`QuestionService`）

- **本轮不改：** 资源中心题库按全局共享保留；不按支部拆分。

## 5. 前端对齐（书记端）

| 页面 | 调整 |
|------|------|
| 档案 / 工作台相关 | 默认筛选 `user.branchId`；去掉「全部支部」选项（书记视角） |
| 任务中心 | 隐藏目标 `ALL` 与多支部选择；创建时锁定本支部 |
| 考试创建 | 不暴露外支部选择（若 UI 有支部字段则锁定或隐藏） |

可选（低优先级）：路由层将 `/branches` 限制为仅 ADMIN（菜单已隐藏，后端已限制写）。

## 6. 错误与体验

- 越权：抛出 `AccessDeniedException`（与现有用户/支部一致），前端展示统一错误提示即可。
- 书记无 `branchId`：列表为空、写操作拒绝（与现有支部列表行为一致）。

## 7. 验收标准

1. 以 `secretary` 登录：用户、档案、发展记录、培训打卡、任务、考试均只能看到/操作本支部数据。
2. 直接调用 API 传入其它 `branchId` / `targetBranchIds` / 外支部 `userId` 时返回无权。
3. 以 `admin` 登录：全局能力不变。
4. MEMBER / 移动端行为本轮无回归要求变更。

## 8. 实现顺序建议

1. 后端：档案 → 发展记录 → 培训 → 任务 → 考试。  
2. 前端：档案筛选 → 任务目标 → 考试创建（若需要）。  
3. 手工验收上述标准。
