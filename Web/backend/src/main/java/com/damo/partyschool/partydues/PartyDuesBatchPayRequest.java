package com.damo.partyschool.partydues;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record PartyDuesBatchPayRequest(
        @NotEmpty List<Long> recordIds,
        @NotNull BigDecimal paidAmount,
        String notes) {}
