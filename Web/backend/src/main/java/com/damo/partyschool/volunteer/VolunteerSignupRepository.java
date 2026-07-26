package com.damo.partyschool.volunteer;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VolunteerSignupRepository extends JpaRepository<VolunteerSignup, Long> {

    List<VolunteerSignup> findByActivityId(Long activityId);

    Optional<VolunteerSignup> findByActivityIdAndUserId(Long activityId, Long userId);

    long countByActivityId(Long activityId);

    long countByActivityIdAndStatus(Long activityId, SignupStatus status);

    List<VolunteerSignup> findByUserId(Long userId);
}
