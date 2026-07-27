package com.damo.partyschool.partydues;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartyDuesReminderRepository extends JpaRepository<PartyDuesReminder, Long> {
    Optional<PartyDuesReminder> findByUserIdAndYearMonth(Long userId, String yearMonth);
}
