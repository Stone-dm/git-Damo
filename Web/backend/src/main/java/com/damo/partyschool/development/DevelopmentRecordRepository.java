package com.damo.partyschool.development;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DevelopmentRecordRepository extends JpaRepository<DevelopmentRecord, Long> {

    List<DevelopmentRecord> findByUserIdOrderByStartDateAsc(Long userId);

    Optional<DevelopmentRecord> findTopByUserIdOrderByStartDateDesc(Long userId);

    List<DevelopmentRecord> findByStage(DevelopmentStage stage);
}
