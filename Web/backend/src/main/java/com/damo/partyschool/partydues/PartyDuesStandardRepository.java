package com.damo.partyschool.partydues;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartyDuesStandardRepository extends JpaRepository<PartyDuesStandard, Long> {
    List<PartyDuesStandard> findByBranchId(Long branchId);

    List<PartyDuesStandard> findByUserId(Long userId);

    List<PartyDuesStandard> findByEffectiveDateLessThanEqual(LocalDate effectiveDate);
}
