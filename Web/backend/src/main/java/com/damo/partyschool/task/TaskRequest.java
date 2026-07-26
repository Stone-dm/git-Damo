package com.damo.partyschool.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TaskRequest(
        @NotBlank String title,
        String description,
        @NotNull TaskType type,
        @NotNull String targetType,     // "ALL" or "BRANCH"
        List<Long> targetBranchIds,
        Long referenceId,
        String dueDate) {
}
