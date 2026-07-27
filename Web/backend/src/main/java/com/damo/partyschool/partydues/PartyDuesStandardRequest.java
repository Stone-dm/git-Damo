package com.damo.partyschool.partydues;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PartyDuesStandardRequest(
        @NotNull Long userId,
        Long branchId,
        @NotNull PartyDuesMemberType memberType,
        @NotNull BigDecimal monthlyIncome,
        LocalDate effectiveDate,
        PartyDuesStandardStatus status,
        String notes) {}
