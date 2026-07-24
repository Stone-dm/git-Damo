package com.damo.partyschool.learning;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;

@RestController
@RequestMapping("/api/learning")
public class LearningController {

    private final LearningService learningService;

    public LearningController(LearningService learningService) {
        this.learningService = learningService;
    }

    @GetMapping
    public ApiResponse<List<LearningView>> list(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
        return ApiResponse.ok(learningService.list(principal));
    }
}
