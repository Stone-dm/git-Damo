package com.damo.partyschool.training;

import jakarta.validation.constraints.NotBlank;

public record TrainingPlanRequest(
        @NotBlank String title,
        String description,
        @NotBlank String planType,
        String status,
        String deadline,
        String relatedStage) {
}
