package com.damo.partyschool.task;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public record TaskView(
        Long id,
        String title,
        String description,
        TaskType type,
        TaskStatus status,
        String targetType,
        List<Long> targetBranchIds,
        Long referenceId,
        LocalDateTime dueDate,
        LocalDateTime createdAt) {

    public static TaskView from(Task task) {
        List<Long> branchIds;
        if (task.getTargetBranchIds() != null && !task.getTargetBranchIds().isBlank()) {
            branchIds = Arrays.stream(task.getTargetBranchIds().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::valueOf)
                    .toList();
        } else {
            branchIds = Collections.emptyList();
        }

        return new TaskView(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getType(),
                task.getStatus(),
                task.getTargetType(),
                branchIds,
                task.getReferenceId(),
                task.getDueDate(),
                task.getCreatedAt());
    }
}
