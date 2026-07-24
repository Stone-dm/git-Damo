package com.damo.partyschool.learning;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.user.Role;

@Service
public class LearningService {

    private final LearningRepository learningRepository;

    public LearningService(LearningRepository learningRepository) {
        this.learningRepository = learningRepository;
    }

    @Transactional(readOnly = true)
    public List<LearningView> list(UserPrincipal actor) {
        List<LearningContent> contents;
        if (actor.getRole() == Role.ADMIN) {
            contents = learningRepository.findAll();
            contents.sort(Comparator.comparing(LearningContent::getCreatedAt).reversed());
        } else if (actor.getBranchId() == null) {
            contents = List.of();
        } else {
            // SECRETARY / MEMBER: own branch + global (branchId null)
            contents = learningRepository.findVisibleForBranch(actor.getBranchId());
        }
        return contents.stream().map(LearningView::from).toList();
    }
}
