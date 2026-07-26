package com.damo.partyschool.task;

import java.time.LocalDateTime;

public record TaskProgressView(
        Long userId,
        String userName,
        Long branchId,
        String branchName,
        boolean completed,
        LocalDateTime completedAt) {
}
