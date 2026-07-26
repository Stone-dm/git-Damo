package com.damo.partyschool.archive;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchArchiveRepository extends JpaRepository<BranchArchive, Long> {

    List<BranchArchive> findByBranchIdOrderByRecordDateDesc(Long branchId);

    List<BranchArchive> findByBranchIdAndCategory(Long branchId, ArchiveCategory category);

    List<BranchArchive> findByBranchIdAndRecordDateBetween(Long branchId, LocalDate from, LocalDate to);
}
