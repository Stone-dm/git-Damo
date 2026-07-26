package com.damo.partyschool.archive;

import java.time.format.DateTimeFormatter;

public record BranchArchiveView(
        Long id,
        Long branchId,
        String category,
        String title,
        String content,
        String fileUrl,
        String fileName,
        String recordDate,
        String uploadedAt,
        Long uploaderId,
        // 三会一课结构化字段
        Long hostUserId,
        String hostUserName,
        Long recorderUserId,
        String recorderUserName,
        Integer expectedCount,
        Integer actualCount,
        Integer absentCount,
        String topics,
        String location) {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static BranchArchiveView from(BranchArchive a) {
        return new BranchArchiveView(
                a.getId(),
                a.getBranchId(),
                a.getCategory().name(),
                a.getTitle(),
                a.getContent(),
                a.getFileUrl(),
                a.getFileName(),
                a.getRecordDate() != null ? a.getRecordDate().format(DATE_FMT) : null,
                a.getUploadedAt() != null ? a.getUploadedAt().format(DATETIME_FMT) : null,
                a.getUploaderId(),
                a.getHostUserId(),
                null,
                a.getRecorderUserId(),
                null,
                a.getExpectedCount(),
                a.getActualCount(),
                a.getAbsentCount(),
                a.getTopics(),
                a.getLocation());
    }

    public static BranchArchiveView from(BranchArchive a, String hostUserName, String recorderUserName) {
        return new BranchArchiveView(
                a.getId(),
                a.getBranchId(),
                a.getCategory().name(),
                a.getTitle(),
                a.getContent(),
                a.getFileUrl(),
                a.getFileName(),
                a.getRecordDate() != null ? a.getRecordDate().format(DATE_FMT) : null,
                a.getUploadedAt() != null ? a.getUploadedAt().format(DATETIME_FMT) : null,
                a.getUploaderId(),
                a.getHostUserId(),
                hostUserName,
                a.getRecorderUserId(),
                recorderUserName,
                a.getExpectedCount(),
                a.getActualCount(),
                a.getAbsentCount(),
                a.getTopics(),
                a.getLocation());
    }
}
