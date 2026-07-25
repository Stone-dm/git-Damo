package com.damo.partyschool.training;

import java.time.LocalDateTime;

public record TrainingPlanView(
        Long id,
        String title,
        String description,
        String planType,
        LocalDateTime createdAt) {

    public static TrainingPlanView from(TrainingPlan plan) {
        return new TrainingPlanView(
                plan.getId(), plan.getTitle(), plan.getDescription(),
                plan.getPlanType(), plan.getCreatedAt());
    }
}
