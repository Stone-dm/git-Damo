package com.damo.partyschool.task;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskProgressRepository extends JpaRepository<TaskProgress, Long> {

    List<TaskProgress> findByTaskId(Long taskId);

    List<TaskProgress> findByUserId(Long userId);

    Optional<TaskProgress> findByTaskIdAndUserId(Long taskId, Long userId);

    long countByTaskIdAndCompletedTrue(Long taskId);

    long countByTaskId(Long taskId);
}
