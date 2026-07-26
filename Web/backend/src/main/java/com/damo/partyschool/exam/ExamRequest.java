package com.damo.partyschool.exam;

import jakarta.validation.constraints.NotBlank;

public record ExamRequest(
        @NotBlank String title,
        ExamStatus status,
        Long branchId) {
}
