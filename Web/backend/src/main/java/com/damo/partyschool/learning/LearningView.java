package com.damo.partyschool.learning;

import java.time.Instant;

public record LearningView(Long id, String title, String summary, Long branchId, Instant createdAt) {

    public static LearningView from(LearningContent content) {
        return new LearningView(
                content.getId(),
                content.getTitle(),
                content.getSummary(),
                content.getBranchId(),
                content.getCreatedAt());
    }
}
