package com.damo.partyschool.cultivation;

import jakarta.validation.constraints.NotNull;

public record CultivationContactRequest(
        @NotNull Long mentorUserId,
        @NotNull Long traineeUserId,
        String role,
        String startDate,
        String endDate,
        String notes) {
}
