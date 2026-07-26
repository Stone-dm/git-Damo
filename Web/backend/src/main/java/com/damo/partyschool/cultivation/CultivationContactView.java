package com.damo.partyschool.cultivation;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public record CultivationContactView(
        Long id,
        Long mentorUserId,
        String mentorName,
        String mentorPhone,
        Long traineeUserId,
        String role,
        String startDate,
        String endDate,
        String notes) {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static CultivationContactView from(CultivationContact c, String mentorName, String mentorPhone) {
        return new CultivationContactView(
                c.getId(),
                c.getMentorUserId(),
                mentorName,
                mentorPhone,
                c.getTraineeUserId(),
                c.getRole(),
                c.getStartDate() != null ? c.getStartDate().format(FMT) : null,
                c.getEndDate() != null ? c.getEndDate().format(FMT) : null,
                c.getNotes());
    }
}
