package com.damo.partyschool.training;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingRecordRepository extends JpaRepository<TrainingRecord, Long> {

    List<TrainingRecord> findByPlanId(Long planId);

    List<TrainingRecord> findByUserId(Long userId);
}
