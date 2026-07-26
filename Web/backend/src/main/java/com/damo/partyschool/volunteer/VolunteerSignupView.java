package com.damo.partyschool.volunteer;

import java.time.LocalDateTime;

public record VolunteerSignupView(
        Long id,
        Long activityId,
        Long userId,
        String userName,
        SignupStatus status,
        Double serviceHours,
        String notes,
        LocalDateTime signedUpAt,
        LocalDateTime participatedAt) {
}
