package com.damo.partyschool.volunteer;

import java.time.LocalDateTime;

public record VolunteerActivityView(
        Long id,
        String title,
        String description,
        String location,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer maxParticipants,
        Long organizerId,
        ActivityStatus status,
        long signupCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static VolunteerActivityView from(VolunteerActivity a, long signupCount) {
        return new VolunteerActivityView(
                a.getId(),
                a.getTitle(),
                a.getDescription(),
                a.getLocation(),
                a.getStartTime(),
                a.getEndTime(),
                a.getMaxParticipants(),
                a.getOrganizerId(),
                a.getStatus(),
                signupCount,
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
