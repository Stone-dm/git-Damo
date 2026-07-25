package com.damo.partyschool.material;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    @Query("""
        select m from Material m
        where m.branchId is null or m.branchId = :branchId
        order by m.createdAt desc
        """)
    List<Material> findVisibleForBranch(@Param("branchId") Long branchId);
}
