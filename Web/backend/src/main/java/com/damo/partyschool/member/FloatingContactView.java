package com.damo.partyschool.member;

import java.time.format.DateTimeFormatter;

public record FloatingContactView(
        Long id,
        Long userId,
        String contactDate,
        String contactMethod,
        String summary,
        String createdAt) {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static FloatingContactView from(FloatingContactRecord r) {
        return new FloatingContactView(
                r.getId(),
                r.getUserId(),
                r.getContactDate() != null ? r.getContactDate().format(DATE_FMT) : null,
                r.getContactMethod(),
                r.getSummary(),
                r.getCreatedAt() != null ? r.getCreatedAt().format(DATETIME_FMT) : null);
    }
}
