package com.damo.partyschool.knowledge;

import java.util.Comparator;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.damo.partyschool.agent.AgentClient;
import com.damo.partyschool.agent.AgentPayloads;
import com.damo.partyschool.agent.AgentUnavailableException;
import com.damo.partyschool.agent.IngestPayload;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.user.Role;

@Service
public class KnowledgeService {

    private final KbDocumentRepository kbDocumentRepository;
    private final AgentClient agentClient;

    public KnowledgeService(KbDocumentRepository kbDocumentRepository, AgentClient agentClient) {
        this.kbDocumentRepository = kbDocumentRepository;
        this.agentClient = agentClient;
    }

    @Transactional
    public KbDocumentView upload(UserPrincipal actor, KnowledgeUploadRequest request) {
        KbDocument doc = new KbDocument();
        doc.setTitle(request.title().trim());
        doc.setKbType(request.kbType());
        doc.setOwnerUserId(actor.getId());
        doc.setBranchId(actor.getBranchId());
        doc.setSourceName(request.sourceName());
        doc.setSyncStatus(SyncStatus.PENDING);
        doc = kbDocumentRepository.save(doc);

        IngestPayload payload = AgentPayloads.ingest(
                String.valueOf(doc.getId()),
                doc.getKbType().name(),
                request.content(),
                String.valueOf(actor.getId()),
                actor.getBranchId() == null ? null : String.valueOf(actor.getBranchId()));

        try {
            agentClient.ingest(payload);
            doc.setSyncStatus(SyncStatus.SYNCED);
        } catch (AgentUnavailableException ex) {
            doc.setSyncStatus(SyncStatus.FAILED);
        }
        doc = kbDocumentRepository.save(doc);
        return KbDocumentView.from(doc);
    }

    @Transactional(readOnly = true)
    public List<KbDocumentView> list(UserPrincipal actor) {
        List<KbDocument> docs;
        if (actor.getRole() == Role.ADMIN) {
            docs = kbDocumentRepository.findAll();
            docs.sort(Comparator.comparing(KbDocument::getCreatedAt).reversed());
        } else if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() == null) {
                docs = List.of();
            } else {
                docs = kbDocumentRepository.findByBranchIdOrderByCreatedAtDesc(actor.getBranchId());
            }
        } else {
            if (actor.getBranchId() == null) {
                docs = List.of();
            } else {
                docs = kbDocumentRepository.findVisibleForMember(actor.getId(), actor.getBranchId());
            }
        }
        return docs.stream().map(KbDocumentView::from).toList();
    }

    @Transactional(readOnly = true)
    public void assertCanAccessDocument(UserPrincipal actor, Long documentId) {
        KbDocument doc = kbDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("文档不存在"));
        if (!canAccess(actor, doc)) {
            throw new AccessDeniedException("无权访问该文档");
        }
    }

    private boolean canAccess(UserPrincipal actor, KbDocument doc) {
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.SECRETARY) {
            return actor.getBranchId() != null && actor.getBranchId().equals(doc.getBranchId());
        }
        // MEMBER: own PERSONAL, or LEARNING for own branch / global
        if (doc.getKbType() == KbType.PERSONAL) {
            return actor.getId().equals(doc.getOwnerUserId());
        }
        return doc.getBranchId() == null || doc.getBranchId().equals(actor.getBranchId());
    }
}
