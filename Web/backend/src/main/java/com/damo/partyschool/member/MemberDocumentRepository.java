package com.damo.partyschool.member;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberDocumentRepository extends JpaRepository<MemberDocument, Long> {

    List<MemberDocument> findByUserId(Long userId);

    List<MemberDocument> findByUserIdAndDocType(Long userId, DocType docType);
}
