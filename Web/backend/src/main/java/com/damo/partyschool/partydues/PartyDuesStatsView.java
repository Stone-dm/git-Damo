package com.damo.partyschool.partydues;

import java.math.BigDecimal;

public record PartyDuesStatsView(
        String yearMonth,
        BigDecimal totalDueAmount,
        BigDecimal totalPaidAmount,
        BigDecimal paymentRate,
        long unpaidCount) {}
