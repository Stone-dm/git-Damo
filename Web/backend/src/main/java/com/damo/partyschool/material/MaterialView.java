package com.damo.partyschool.material;

import java.time.Instant;

public record MaterialView(
        Long id,
        String title,
        MaterialType type,
        String content,
        String fileUrl,
        String fileAccessUrl,
        Long branchId,
        Long uploaderId,
        Instant createdAt) {

    public static MaterialView from(Material m, String accessUrl) {
        return new MaterialView(
                m.getId(),
                m.getTitle(),
                m.getType(),
                m.getContent(),
                m.getFileUrl(),
                accessUrl,
                m.getBranchId(),
                m.getUploaderId(),
                m.getCreatedAt());
    }
}
