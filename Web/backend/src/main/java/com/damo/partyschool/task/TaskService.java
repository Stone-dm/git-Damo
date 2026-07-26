package com.damo.partyschool.task;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.branch.Branch;
import com.damo.partyschool.branch.BranchRepository;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public TaskService(
            TaskRepository taskRepository,
            TaskProgressRepository progressRepository,
            UserRepository userRepository,
            BranchRepository branchRepository) {
        this.taskRepository = taskRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
    }

    // ---- Task CRUD ----

    @Transactional
    public TaskView createTask(UserPrincipal actor, TaskRequest request) {
        Task task = new Task();
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setType(request.type());
        task.setStatus(TaskStatus.DRAFT);

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
            task.setTargetBranchIds(
                    targetBranchIds.stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(",")));
        }

        task.setReferenceId(request.referenceId());

        if (request.dueDate() != null && !request.dueDate().isBlank()) {
            try {
                task.setDueDate(LocalDateTime.parse(request.dueDate() + "T23:59:59"));
            } catch (Exception ignored) {
                // ignore unparseable date
            }
        }

        task = taskRepository.save(task);
        return TaskView.from(task);
    }

    @Transactional(readOnly = true)
    public List<TaskView> listTasks(UserPrincipal actor) {
        List<Task> tasks = taskRepository.findAll();
        if (actor.getRole() == Role.ADMIN) {
            // admin sees all
        } else if (actor.getBranchId() != null) {
            // secretary sees tasks targeting their branch or all branches
            String branchIdStr = String.valueOf(actor.getBranchId());
            tasks = tasks.stream()
                    .filter(t -> "ALL".equals(t.getTargetType())
                            || (t.getTargetBranchIds() != null
                                    && Arrays.asList(t.getTargetBranchIds().split(","))
                                            .contains(branchIdStr)))
                    .toList();
        } else {
            tasks = List.of();
        }
        return tasks.stream().map(TaskView::from).toList();
    }

    @Transactional
    public TaskView dispatchTask(UserPrincipal actor, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        assertCanMutateTask(actor, task);

        if (task.getStatus() != TaskStatus.DRAFT) {
            throw new IllegalArgumentException("只能派发草稿状态的任务");
        }

        // get targeted users
        List<User> targetUsers = resolveTargetUsers(task);

        // create progress records for each user
        for (User user : targetUsers) {
            TaskProgress progress = new TaskProgress();
            progress.setTaskId(task.getId());
            progress.setUserId(user.getId());
            progress.setCompleted(false);
            progressRepository.save(progress);
        }

        task.setStatus(TaskStatus.ACTIVE);
        task = taskRepository.save(task);
        return TaskView.from(task);
    }

    @Transactional
    public TaskView closeTask(UserPrincipal actor, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        assertCanMutateTask(actor, task);

        if (task.getStatus() != TaskStatus.ACTIVE) {
            throw new IllegalArgumentException("只能关闭进行中的任务");
        }

        task.setStatus(TaskStatus.CLOSED);
        task = taskRepository.save(task);
        return TaskView.from(task);
    }

    @Transactional
    public TaskView reopenTask(UserPrincipal actor, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        assertCanMutateTask(actor, task);

        if (task.getStatus() != TaskStatus.CLOSED) {
            throw new IllegalArgumentException("只能重新开放已关闭的任务");
        }

        task.setStatus(TaskStatus.ACTIVE);
        task = taskRepository.save(task);
        return TaskView.from(task);
    }

    @Transactional
    public void deleteTask(UserPrincipal actor, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        assertCanMutateTask(actor, task);

        if (task.getStatus() != TaskStatus.CLOSED) {
            throw new IllegalArgumentException("只能删除已关闭的任务");
        }

        // delete all progress records
        List<TaskProgress> progressList = progressRepository.findByTaskId(taskId);
        progressRepository.deleteAll(progressList);

        taskRepository.delete(task);
    }

    // ---- Progress ----

    @Transactional(readOnly = true)
    public List<TaskProgressView> getTaskProgress(UserPrincipal actor, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        assertTaskVisible(actor, task);

        List<TaskProgress> progressList = progressRepository.findByTaskId(taskId);

        // batch-load users and branches
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<Long, Branch> branchMap = branchRepository.findAll().stream()
                .collect(Collectors.toMap(Branch::getId, b -> b));

        List<TaskProgressView> views = progressList.stream()
                .map(p -> {
                    User user = userMap.get(p.getUserId());
                    String userName = user != null ? user.getName() : "未知用户";
                    Long branchId = user != null ? user.getBranchId() : null;
                    String branchName = "—";
                    if (branchId != null && branchMap.containsKey(branchId)) {
                        branchName = branchMap.get(branchId).getName();
                    }

                    return new TaskProgressView(
                            p.getUserId(),
                            userName,
                            branchId,
                            branchName,
                            p.isCompleted(),
                            p.getCompletedAt());
                })
                .toList();

        if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() == null) {
                return List.of();
            }
            return views.stream()
                    .filter(v -> Objects.equals(v.branchId(), actor.getBranchId()))
                    .toList();
        }
        return views;
    }

    @Transactional(readOnly = true)
    public List<BranchCompletionView> getBranchCompletion(UserPrincipal actor, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        assertTaskVisible(actor, task);

        List<TaskProgress> progressList = progressRepository.findByTaskId(taskId);

        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<Long, Branch> branchMap = branchRepository.findAll().stream()
                .collect(Collectors.toMap(Branch::getId, b -> b));

        // group progress by branch
        Map<Long, List<TaskProgress>> groupedByBranch = new LinkedHashMap<>();
        for (TaskProgress p : progressList) {
            User user = userMap.get(p.getUserId());
            Long branchId = user != null ? user.getBranchId() : -1L;
            groupedByBranch.computeIfAbsent(branchId, k -> new ArrayList<>()).add(p);
        }

        List<BranchCompletionView> result = new ArrayList<>();
        for (Map.Entry<Long, List<TaskProgress>> entry : groupedByBranch.entrySet()) {
            Long branchId = entry.getKey();
            List<TaskProgress> list = entry.getValue();
            int total = list.size();
            long completed = list.stream().filter(TaskProgress::isCompleted).count();
            double rate = total > 0 ? (double) completed / total * 100.0 : 0.0;

            String branchName = "—";
            if (branchId != null && branchMap.containsKey(branchId)) {
                branchName = branchMap.get(branchId).getName();
            }

            result.add(new BranchCompletionView(
                    branchId != null ? branchId : -1L,
                    branchName,
                    total,
                    (int) completed,
                    Math.round(rate * 10.0) / 10.0)); // one decimal place
        }

        // sort by branch name
        result.sort((a, b) -> a.branchName().compareTo(b.branchName()));

        if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() == null) {
                return List.of();
            }
            return result.stream()
                    .filter(v -> Objects.equals(v.branchId(), actor.getBranchId()))
                    .toList();
        }
        return result;
    }

    // ---- helpers ----

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
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        String own = String.valueOf(actor.getBranchId());
        if (ids.size() != 1 || !ids.contains(own)) {
            throw new AccessDeniedException("书记仅可管理本支部任务");
        }
    }

    private List<User> resolveTargetUsers(Task task) {
        if ("ALL".equals(task.getTargetType())) {
            // all users with role MEMBER
            return userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.MEMBER)
                    .toList();
        }

        if (task.getTargetBranchIds() != null && !task.getTargetBranchIds().isBlank()) {
            List<Long> branchIds = Arrays.stream(task.getTargetBranchIds().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::valueOf)
                    .toList();
            // get MEMBER users whose branchId is in the target list
            return userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.MEMBER
                            && u.getBranchId() != null
                            && branchIds.contains(u.getBranchId()))
                    .toList();
        }

        return Collections.emptyList();
    }
}
