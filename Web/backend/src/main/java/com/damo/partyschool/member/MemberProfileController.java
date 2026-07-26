package com.damo.partyschool.member;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
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
        return ApiResponse.ok(service.listForActor(principal, branchId));
    }

    /** 获取单个党员的详细档案 */
    @GetMapping("/user/{userId}")
    public ApiResponse<MemberProfileView> getByUserId(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.getByUserId(principal, userId));
    }

    /** 创建或更新党员档案 */
    @PostMapping
    public ApiResponse<MemberProfileView> save(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody MemberProfileRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.createOrUpdate(principal, request));
    }

    /** 获取流动党员列表 */
    @GetMapping("/floating")
    public ApiResponse<List<MemberProfileView>> listFloating(
            @AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return ApiResponse.ok(service.listFloating(principal));
    }

    /** 将党员标记为流动状态 */
    @PostMapping("/{userId}/mark-floating")
    public ApiResponse<MemberProfileView> markFloating(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId,
            @RequestBody MemberProfileRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.markFloating(principal, userId, request));
    }

    /** 将流动党员转回正常状态 */
    @PostMapping("/{userId}/return")
    public ApiResponse<MemberProfileView> returnFromFloating(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.returnFromFloating(principal, userId));
    }

    /** 添加联系记录 */
    @PostMapping("/{userId}/floating-contacts")
    public ApiResponse<FloatingContactView> addFloatingContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId,
            @RequestBody FloatingContactRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.addFloatingContact(principal, userId, request));
    }

    /** 查看联系记录列表 */
    @GetMapping("/{userId}/floating-contacts")
    public ApiResponse<List<FloatingContactView>> listFloatingContacts(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.listFloatingContacts(principal, userId));
    }

    /** 编辑联系记录 */
    @PutMapping("/floating-contacts/{id}")
    public ApiResponse<FloatingContactView> updateFloatingContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody FloatingContactRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.updateFloatingContact(principal, id, request));
    }

    /** 删除联系记录 */
    @DeleteMapping("/floating-contacts/{id}")
    public ApiResponse<Void> deleteFloatingContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        service.deleteFloatingContact(principal, id);
        return ApiResponse.ok(null);
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
