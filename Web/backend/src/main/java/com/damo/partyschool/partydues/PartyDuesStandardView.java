package com.damo.partyschool.partydues;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PartyDuesStandardView(
        Long id,
        Long userId,
        String userName,
        Long branchId,
        String branchName,
        PartyDuesMemberType memberType,
        BigDecimal monthlyIncome,
        BigDecimal rate,
        BigDecimal monthlyAmount,
        LocalDate effectiveDate,
        PartyDuesStandardStatus status,
        String notes) {}
