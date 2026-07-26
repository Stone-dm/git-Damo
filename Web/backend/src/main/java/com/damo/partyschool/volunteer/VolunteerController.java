package com.damo.partyschool.volunteer;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/volunteer")
public class VolunteerController {

    private final VolunteerService volunteerService;

    public VolunteerController(VolunteerService volunteerService) {
        this.volunteerService = volunteerService;
    }

    // ---- Activity CRUD ----

    @PostMapping("/activities")
    public ApiResponse<VolunteerActivityView> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VolunteerActivityRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.createActivity(principal, request));
    }

    @GetMapping("/activities")
    public ApiResponse<List<VolunteerActivityView>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        requireAuth(principal);
        ActivityStatus activityStatus = null;
        if (status != null && !status.isBlank()) {
            activityStatus = ActivityStatus.valueOf(status.toUpperCase());
        }
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : null;
        return ApiResponse.ok(volunteerService.listActivities(principal, activityStatus, from, to));
    }

    @GetMapping("/activities/{id}")
    public ApiResponse<VolunteerActivityView> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.getActivity(principal, id));
    }

    @PutMapping("/activities/{id}")
    public ApiResponse<VolunteerActivityView> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody VolunteerActivityRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.updateActivity(principal, id, request));
    }

    @DeleteMapping("/activities/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        volunteerService.deleteActivity(principal, id);
        return ApiResponse.ok();
    }

    // ---- Status transitions ----

    @PutMapping("/activities/{id}/publish")
    public ApiResponse<VolunteerActivityView> publish(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.publishActivity(principal, id));
    }

    @PutMapping("/activities/{id}/finish")
    public ApiResponse<VolunteerActivityView> finish(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.finishActivity(principal, id));
    }

    // ---- Signup ----

    @PostMapping("/activities/{id}/signup")
    public ApiResponse<VolunteerSignupView> signup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.signup(principal, id));
    }

    @DeleteMapping("/activities/{id}/signup")
    public ApiResponse<Void> cancelSignup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        volunteerService.cancelSignup(principal, id);
        return ApiResponse.ok();
    }

    @GetMapping("/activities/{id}/signups")
    public ApiResponse<List<VolunteerSignupView>> signups(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.listSignups(principal, id));
    }

    // ---- Attendance ----

    @PutMapping("/signups/{id}/attend")
    public ApiResponse<VolunteerSignupView> attend(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody AttendRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.attend(principal, id, request.serviceHours()));
    }

    // ---- Stats ----

    @GetMapping("/stats")
    public ApiResponse<VolunteerStats> stats(
            @AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return ApiResponse.ok(volunteerService.getStats(principal));
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
