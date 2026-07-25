package com.damo.partyschool.member;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/member-profiles")
public class MemberProfileController {

    private final MemberProfileService service;

    public MemberProfileController(MemberProfileService service) {
        this.service = service;
    }

    /** 获取全部党员档案，可按支部筛选 */
    @GetMapping
    public ApiResponse<List<MemberProfileView>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "branchId", required = false) Long branchId) {
        requireAuth(principal);
        if (branchId != null) {
            return ApiResponse.ok(service.listByBranch(branchId));
        }
        return ApiResponse.ok(service.listAll());
    }

    /** 获取单个党员的详细档案 */
    @GetMapping("/user/{userId}")
    public ApiResponse<MemberProfileView> getByUserId(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.getByUserId(userId));
    }

    /** 创建或更新党员档案 */
    @PostMapping
    public ApiResponse<MemberProfileView> save(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody MemberProfileRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.createOrUpdate(request));
    }

    /** 获取流动党员列表 */
    @GetMapping("/floating")
    public ApiResponse<List<MemberProfileView>> listFloating(
            @AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return ApiResponse.ok(service.listFloating());
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
