package com.damo.partyschool.knowledge;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KbDocumentRepository extends JpaRepository<KbDocument, Long> {

    @Query("""
            select d from KbDocument d
            where d.ownerUserId = :userId
               or (d.kbType = com.damo.partyschool.knowledge.KbType.LEARNING
                   and (d.branchId is null or d.branchId = :branchId))
            order by d.createdAt desc
            """)
    List<KbDocument> findVisibleForMember(@Param("userId") Long userId, @Param("branchId") Long branchId);
}
