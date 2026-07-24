package com.damo.partyschool.learning;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearningRepository extends JpaRepository<LearningContent, Long> {

    @Query("""
            select l from LearningContent l
            where l.branchId is null or l.branchId = :branchId
            order by l.createdAt desc
            """)
    List<LearningContent> findVisibleForBranch(@Param("branchId") Long branchId);
}
