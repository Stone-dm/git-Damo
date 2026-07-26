package com.damo.partyschool.member;

import java.time.format.DateTimeFormatter;

public record MemberDocumentView(
        Long id,
        Long userId,
        String docType,
        String title,
        String fileUrl,
        String fileName,
        String uploadedAt) {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static MemberDocumentView from(MemberDocument doc) {
        return new MemberDocumentView(
                doc.getId(),
                doc.getUserId(),
                doc.getDocType().name(),
                doc.getTitle(),
                doc.getFileUrl(),
                doc.getFileName(),
                doc.getUploadedAt() != null ? doc.getUploadedAt().format(FMT) : null);
    }
}
