package com.damo.partyschool.partydues;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PartyDuesPayRequest(@NotNull BigDecimal paidAmount, String notes) {}
