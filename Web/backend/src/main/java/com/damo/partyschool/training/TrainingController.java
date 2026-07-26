package com.damo.partyschool.training;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/training")
public class TrainingController {

    private final TrainingService service;

    public TrainingController(TrainingService service) {
        this.service = service;
    }

    // ---- Plans ----

    @GetMapping("/plans")
    public ApiResponse<List<TrainingPlanView>> listPlans(
            @AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return ApiResponse.ok(service.listPlans());
    }

    @PostMapping("/plans")
    public ApiResponse<TrainingPlanView> createPlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TrainingPlanRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.createPlan(request));
    }

    @DeleteMapping("/plans/{id}")
    public ApiResponse<Void> deletePlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        service.deletePlan(id);
        return ApiResponse.ok();
    }

    /** 发布/取消发布计划 */
    @PutMapping("/plans/{id}/publish")
    public ApiResponse<TrainingPlanView> publishPlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam("status") String status) {
        requireAuth(principal);
        return ApiResponse.ok(service.publishPlan(id, status));
    }

    /** 批量分配计划给支部党员 */
    @PostMapping("/plans/{id}/batch-assign")
    public ApiResponse<Integer> batchAssign(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody List<Long> branchIds) {
        requireAuth(principal);
        return ApiResponse.ok(service.batchAssign(id, branchIds));
    }

    // ---- Records ----

    @PostMapping("/plans/{planId}/complete/{userId}")
    public ApiResponse<TrainingRecordView> markComplete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long planId,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.markComplete(principal, planId, userId));
    }

    @GetMapping("/plans/{planId}/records")
    public ApiResponse<List<TrainingRecordView>> recordsByPlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long planId) {
        requireAuth(principal);
        return ApiResponse.ok(service.listRecordsByPlan(principal, planId));
    }

    @GetMapping("/users/{userId}/records")
    public ApiResponse<List<TrainingRecordView>> recordsByUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.listRecordsByUser(principal, userId));
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
