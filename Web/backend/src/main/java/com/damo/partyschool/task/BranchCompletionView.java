package com.damo.partyschool.task;

public record BranchCompletionView(
        Long branchId,
        String branchName,
        int totalAssigned,
        int completedCount,
        double completionRate) {
}
