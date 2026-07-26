package com.damo.partyschool.member;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/member-profiles")
public class MemberDocumentController {

    private final MemberDocumentService docService;

    public MemberDocumentController(MemberDocumentService docService) {
        this.docService = docService;
    }

    /** 上传档案材料 */
    @PostMapping("/{userId}/documents")
    public ApiResponse<MemberDocumentView> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId,
            @RequestParam("docType") String docType,
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file) {
        requireAuth(principal);
        try {
            return ApiResponse.ok(docService.upload(userId, docType, title, file, principal));
        } catch (Exception e) {
            throw new RuntimeException("材料上传失败: " + e.getMessage(), e);
        }
    }

    /** 查看某党员的档案材料列表 */
    @GetMapping("/{userId}/documents")
    public ApiResponse<List<MemberDocumentView>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(docService.listByUser(userId, principal));
    }

    /** 下载/预览文件（302 重定向到 MinIO 预签名 URL，有效期10分钟；MinIO 不可用时返回 503） */
    @GetMapping("/{userId}/documents/{id}/file")
    public ResponseEntity<Void> getFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId,
            @PathVariable Long id) {
        requireAuth(principal);
        String url = docService.getFilePresignedUrl(userId, id, principal);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, url)
                .build();
    }

    /** 删除档案材料 */
    @DeleteMapping("/{userId}/documents/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId,
            @PathVariable Long id) {
        requireAuth(principal);
        docService.delete(id, principal);
        return ApiResponse.ok(null);
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
