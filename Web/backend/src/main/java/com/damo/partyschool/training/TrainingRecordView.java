package com.damo.partyschool.training;

import java.time.LocalDateTime;

public record TrainingRecordView(
        Long id,
        Long planId,
        String planTitle,
        Long userId,
        String userName,
        boolean completed,
        LocalDateTime completedAt) {
}
