package com.damo.partyschool.development;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record DevelopmentRecordRequest(
        @NotNull Long userId,
        @NotNull DevelopmentStage stage,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        String notes) {
}
