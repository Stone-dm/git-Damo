package com.damo.partyschool.agent;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
import com.damo.partyschool.knowledge.KnowledgeService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    private final AgentClient agentClient;
    private final KnowledgeService knowledgeService;

    public AgentController(AgentClient agentClient, KnowledgeService knowledgeService) {
        this.agentClient = agentClient;
        this.knowledgeService = knowledgeService;
    }

    @PostMapping("/recommend")
    public ApiResponse<RecommendResponse> recommend(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) RecommendRequest request) {
        requirePrincipal(principal);
        String query = request != null ? request.query() : null;
        RecommendPayload payload = AgentPayloads.recommend(
                String.valueOf(principal.getId()),
                principal.getBranchId() == null ? null : String.valueOf(principal.getBranchId()),
                query);
        return ApiResponse.ok(agentClient.recommend(payload));
    }

    @PostMapping("/chat")
    public ApiResponse<ChatResponse> chat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChatRequest request) {
        requirePrincipal(principal);
        if (request.documentId() != null) {
            knowledgeService.assertCanAccessDocument(principal, request.documentId());
        }
        ChatPayload payload = AgentPayloads.chat(
                String.valueOf(principal.getId()),
                principal.getBranchId() == null ? null : String.valueOf(principal.getBranchId()),
                principal.getRole().name(),
                request.message(),
                request.documentId() == null ? null : String.valueOf(request.documentId()),
                request.text(),
                request.history());
        return ApiResponse.ok(agentClient.chat(payload));
    }

    private static void requirePrincipal(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
