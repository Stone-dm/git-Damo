package com.damo.partyschool.knowledge;

import java.time.Instant;

public record KbDocumentView(
        Long id,
        String title,
        KbType kbType,
        Long ownerUserId,
        Long branchId,
        String sourceName,
        SyncStatus syncStatus,
        Instant createdAt) {

    public static KbDocumentView from(KbDocument doc) {
        return new KbDocumentView(
                doc.getId(),
                doc.getTitle(),
                doc.getKbType(),
                doc.getOwnerUserId(),
                doc.getBranchId(),
                doc.getSourceName(),
                doc.getSyncStatus(),
                doc.getCreatedAt());
    }
}
