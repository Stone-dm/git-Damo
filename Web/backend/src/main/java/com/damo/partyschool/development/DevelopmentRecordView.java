package com.damo.partyschool.development;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DevelopmentRecordView(
        Long id,
        Long userId,
        String userName,
        DevelopmentStage stage,
        LocalDate startDate,
        LocalDate endDate,
        String notes,
        LocalDateTime createdAt) {

    public static DevelopmentRecordView from(DevelopmentRecord r, String userName) {
        return new DevelopmentRecordView(
                r.getId(), r.getUserId(), userName,
                r.getStage(), r.getStartDate(), r.getEndDate(),
                r.getNotes(), r.getCreatedAt());
    }
}
