package com.damo.partyschool.training;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record TrainingPlanView(
        Long id,
        String title,
        String description,
        String planType,
        String status,
        String deadline,
        String relatedStage,
        String createdAt) {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static TrainingPlanView from(TrainingPlan plan) {
        return new TrainingPlanView(
                plan.getId(), plan.getTitle(), plan.getDescription(),
                plan.getPlanType(),
                plan.getStatus(),
                plan.getDeadline() != null ? plan.getDeadline().format(DATE_FMT) : null,
                plan.getRelatedStage(),
                plan.getCreatedAt() != null ? plan.getCreatedAt().format(FMT) : null);
    }
}
