package com.damo.partyschool.knowledge;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @PostMapping("/upload")
    public ApiResponse<KbDocumentView> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody KnowledgeUploadRequest request) {
        requirePrincipal(principal);
        return ApiResponse.ok(knowledgeService.upload(principal, request));
    }

    @GetMapping
    public ApiResponse<List<KbDocumentView>> list(@AuthenticationPrincipal UserPrincipal principal) {
        requirePrincipal(principal);
        return ApiResponse.ok(knowledgeService.list(principal));
    }

    private static void requirePrincipal(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
