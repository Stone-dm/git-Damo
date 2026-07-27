package com.damo.partyschool.partydues;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PartyDuesRecordRepository
        extends JpaRepository<PartyDuesRecord, Long>, JpaSpecificationExecutor<PartyDuesRecord> {
    Optional<PartyDuesRecord> findByUserIdAndYearMonth(Long userId, String yearMonth);

    List<PartyDuesRecord> findByUserIdOrderByYearMonthDesc(Long userId);
}
