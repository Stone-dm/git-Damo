package com.damo.partyschool.cultivation;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CultivationContactRepository extends JpaRepository<CultivationContact, Long> {

    List<CultivationContact> findByTraineeUserId(Long traineeUserId);

    List<CultivationContact> findByMentorUserId(Long mentorUserId);
}
