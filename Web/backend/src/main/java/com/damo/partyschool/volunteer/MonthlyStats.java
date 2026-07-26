package com.damo.partyschool.volunteer;

public record MonthlyStats(
        String month,
        long activityCount,
        double serviceHours) {
}
