package com.damo.partyschool.volunteer;

import java.util.List;

public record VolunteerStats(
        long totalActivities,
        long totalParticipations,
        double totalServiceHours,
        // 本月
        long thisMonthActivities,
        long thisMonthParticipations,
        double thisMonthServiceHours,
        // 本年
        long thisYearActivities,
        long thisYearParticipations,
        double thisYearServiceHours,
        // 近12月趋势
        List<MonthlyStats> monthlyTrends,
        // 状态分布
        List<StatusCount> statusDistribution) {
}
