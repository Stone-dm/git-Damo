package com.damo.partyschool.material;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    public ApiResponse<List<MaterialView>> list(@AuthenticationPrincipal UserPrincipal principal) {
        requirePrincipal(principal);
        return ApiResponse.ok(materialService.list(principal));
    }

    @PostMapping
    public ApiResponse<MaterialView> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("title") String title,
            @RequestParam("type") MaterialType type,
            @RequestParam("file") MultipartFile file) {
        requirePrincipal(principal);
        try {
            return ApiResponse.ok(materialService.upload(principal, title, type, file));
        } catch (Exception e) {
            throw new RuntimeException("素材上传失败: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requirePrincipal(principal);
        materialService.delete(principal, id);
        return ApiResponse.ok();
    }

    private static void requirePrincipal(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
