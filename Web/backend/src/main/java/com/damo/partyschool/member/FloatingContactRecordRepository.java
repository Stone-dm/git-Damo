package com.damo.partyschool.member;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloatingContactRecordRepository extends JpaRepository<FloatingContactRecord, Long> {

    List<FloatingContactRecord> findByUserIdOrderByContactDateDesc(Long userId);
}
