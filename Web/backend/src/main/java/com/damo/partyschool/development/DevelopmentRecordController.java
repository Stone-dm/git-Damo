package com.damo.partyschool.development;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/development-records")
public class DevelopmentRecordController {

    private final DevelopmentRecordService service;

    public DevelopmentRecordController(DevelopmentRecordService service) {
        this.service = service;
    }

    /** 添加阶段记录 */
    @PostMapping
    public ApiResponse<DevelopmentRecordView> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DevelopmentRecordRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.create(principal, request));
    }

    /** 编辑阶段记录 */
    @PutMapping("/{id}")
    public ApiResponse<DevelopmentRecordView> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody DevelopmentRecordRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.update(principal, id, request));
    }

    /** 获取某党员的发展历程 */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<DevelopmentRecordView>> byUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.listByUser(principal, userId));
    }

    /** 按阶段筛选（如查看所有入党积极分子） */
    @GetMapping
    public ApiResponse<List<DevelopmentRecordView>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "stage", required = false) DevelopmentStage stage) {
        requireAuth(principal);
        if (stage != null) {
            return ApiResponse.ok(service.listByStage(principal, stage));
        }
        return ApiResponse.ok(service.listAll(principal));
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
