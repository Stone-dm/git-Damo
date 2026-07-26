package com.damo.partyschool.task;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ApiResponse<List<TaskView>> list(@AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return ApiResponse.ok(taskService.listTasks(principal));
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskView> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(
                taskService.listTasks(principal).stream()
                        .filter(t -> t.id().equals(id))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("任务不存在")));
    }

    @PostMapping
    public ApiResponse<TaskView> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(taskService.createTask(principal, request));
    }

    @PostMapping("/{id}/dispatch")
    public ApiResponse<TaskView> dispatch(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(taskService.dispatchTask(principal, id));
    }

    @PostMapping("/{id}/close")
    public ApiResponse<TaskView> close(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(taskService.closeTask(principal, id));
    }

    @PostMapping("/{id}/reopen")
    public ApiResponse<TaskView> reopen(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(taskService.reopenTask(principal, id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        taskService.deleteTask(principal, id);
        return ApiResponse.ok();
    }

    @GetMapping("/{id}/progress")
    public ApiResponse<List<TaskProgressView>> progress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(taskService.getTaskProgress(principal, id));
    }

    @GetMapping("/{id}/branch-completion")
    public ApiResponse<List<BranchCompletionView>> branchCompletion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(taskService.getBranchCompletion(principal, id));
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
