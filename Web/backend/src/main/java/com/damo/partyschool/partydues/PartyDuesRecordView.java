package com.damo.partyschool.partydues;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PartyDuesRecordView(
        Long id,
        Long userId,
        String userName,
        Long branchId,
        String branchName,
        String yearMonth,
        BigDecimal dueAmount,
        BigDecimal paidAmount,
        PartyDuesRecordStatus status,
        LocalDateTime paidAt,
        String notes) {}
