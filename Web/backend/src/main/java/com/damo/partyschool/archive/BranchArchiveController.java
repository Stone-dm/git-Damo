package com.damo.partyschool.archive;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.auth.UserView;
import com.damo.partyschool.common.ApiResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/branches/{branchId}/archives")
public class BranchArchiveController {

    private final BranchArchiveService service;

    public BranchArchiveController(BranchArchiveService service) {
        this.service = service;
    }

    /** 获取支部内可选用户（主持人/记录人） */
    @GetMapping("/users")
    public ApiResponse<List<UserView>> listUsers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long branchId) {
        requireAuth(principal);
        return ApiResponse.ok(service.listBranchUsers(principal, branchId));
    }

    /** 创建归档材料 */
    @PostMapping
    public ApiResponse<BranchArchiveView> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long branchId,
            @RequestParam("category") String category,
            @RequestParam("title") String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "recordDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate recordDate,
            @RequestParam(value = "file", required = false) MultipartFile file,
            // 三会一课字段
            @RequestParam(value = "hostUserId", required = false) Long hostUserId,
            @RequestParam(value = "recorderUserId", required = false) Long recorderUserId,
            @RequestParam(value = "expectedCount", required = false) Integer expectedCount,
            @RequestParam(value = "actualCount", required = false) Integer actualCount,
            @RequestParam(value = "absentCount", required = false) Integer absentCount,
            @RequestParam(value = "topics", required = false) String topics,
            @RequestParam(value = "location", required = false) String location) {
        requireAuth(principal);
        ArchiveCategory cat;
        try {
            cat = ArchiveCategory.valueOf(category);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("无效的归档类别: " + category);
        }
        return ApiResponse.ok(service.create(principal, branchId, cat, title, content,
                recordDate, file, hostUserId, recorderUserId,
                expectedCount, actualCount, absentCount, topics, location));
    }

    /** 列表查询 */
    @GetMapping
    public ApiResponse<List<BranchArchiveView>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long branchId,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "dateFrom", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(value = "dateTo", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        requireAuth(principal);
        return ApiResponse.ok(service.list(principal, branchId, category, dateFrom, dateTo));
    }

    /** 获取详情 */
    @GetMapping("/{id}")
    public ApiResponse<BranchArchiveView> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long branchId,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(service.get(principal, branchId, id));
    }

    /** 编辑归档材料 */
    @PutMapping("/{id}")
    public ApiResponse<BranchArchiveView> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long branchId,
            @PathVariable Long id,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "recordDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate recordDate,
            @RequestParam(value = "file", required = false) MultipartFile file,
            // 三会一课字段
            @RequestParam(value = "hostUserId", required = false) Long hostUserId,
            @RequestParam(value = "recorderUserId", required = false) Long recorderUserId,
            @RequestParam(value = "expectedCount", required = false) Integer expectedCount,
            @RequestParam(value = "actualCount", required = false) Integer actualCount,
            @RequestParam(value = "absentCount", required = false) Integer absentCount,
            @RequestParam(value = "topics", required = false) String topics,
            @RequestParam(value = "location", required = false) String location) {
        requireAuth(principal);
        ArchiveCategory cat = null;
        if (category != null) {
            try {
                cat = ArchiveCategory.valueOf(category);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("无效的归档类别: " + category);
            }
        }
        return ApiResponse.ok(service.update(principal, branchId, id, cat, title, content,
                recordDate, file, hostUserId, recorderUserId,
                expectedCount, actualCount, absentCount, topics, location));
    }

    /** 删除归档材料 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long branchId,
            @PathVariable Long id) {
        requireAuth(principal);
        service.delete(principal, branchId, id);
        return ApiResponse.ok(null);
    }

    /** 下载附件 */
    @GetMapping("/{id}/file")
    public ResponseEntity<Void> getFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long branchId,
            @PathVariable Long id) {
        requireAuth(principal);
        String url = service.getFilePresignedUrl(principal, branchId, id);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, url)
                .build();
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
