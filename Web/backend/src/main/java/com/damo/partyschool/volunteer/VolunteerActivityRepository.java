package com.damo.partyschool.volunteer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface VolunteerActivityRepository
        extends JpaRepository<VolunteerActivity, Long>,
                JpaSpecificationExecutor<VolunteerActivity> {
}
