package com.damo.partyschool.volunteer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record VolunteerActivityRequest(
        @NotBlank String title,
        String description,
        String location,
        @NotNull LocalDateTime startTime,
        @NotNull LocalDateTime endTime,
        Integer maxParticipants) {
}
