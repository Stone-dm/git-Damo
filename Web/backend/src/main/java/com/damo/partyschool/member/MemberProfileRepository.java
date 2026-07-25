package com.damo.partyschool.member;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberProfileRepository extends JpaRepository<MemberProfile, Long> {

    Optional<MemberProfile> findByUserId(Long userId);

    List<MemberProfile> findByMemberStatus(MemberStatus status);
}
