package com.damo.partyschool.archive;

public record BranchArchiveRequest(
        String category,
        String title,
        String content,
        String recordDate,
        /** 附件：MultipartFile 由 Controller 单独接收，这里仅用于 Swagger/文档说明 */
        String fileName) {
}
