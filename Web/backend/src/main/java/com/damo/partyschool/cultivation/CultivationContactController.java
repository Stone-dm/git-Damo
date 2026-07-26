package com.damo.partyschool.cultivation;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cultivation-contacts")
public class CultivationContactController {

    private final CultivationContactService service;

    public CultivationContactController(CultivationContactService service) {
        this.service = service;
    }

    @PostMapping
    public ApiResponse<CultivationContactView> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CultivationContactRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(service.create(principal, request));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<CultivationContactView>> listByTrainee(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        requireAuth(principal);
        return ApiResponse.ok(service.listByTrainee(principal, userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        service.delete(principal, id);
        return ApiResponse.ok(null);
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) throw new AuthException("Unauthorized");
    }
}
