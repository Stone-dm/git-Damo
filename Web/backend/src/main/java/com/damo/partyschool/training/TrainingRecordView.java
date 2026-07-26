package com.damo.partyschool.training;

import java.time.LocalDateTime;

public record TrainingRecordView(
        Long id,
        Long planId,
        String planTitle,
        Long userId,
        String userName,
        Long branchId,
        String branchName,
        boolean completed,
        String completedAt) {
}
