package com.damo.partyschool.branch;

import java.util.List;
import java.util.Objects;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;

@Service
public class BranchService {

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    public void assertCanManageBranch(User actor, Long branchId) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }
        if (actor.getRole() == Role.SECRETARY && Objects.equals(actor.getBranchId(), branchId)) {
            return;
        }
        throw new AccessDeniedException("无权操作该支部");
    }

    public void assertAdmin(UserPrincipal actor) {
        if (actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("仅管理员可写支部");
        }
    }

    @Transactional(readOnly = true)
    public List<BranchView> list(UserPrincipal actor) {
        if (actor.getRole() == Role.ADMIN) {
            return branchRepository.findAll().stream().map(BranchView::from).toList();
        }
        if (actor.getBranchId() == null) {
            return List.of();
        }
        return branchRepository.findById(actor.getBranchId())
                .map(b -> List.of(BranchView.from(b)))
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public BranchView get(UserPrincipal actor, Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("支部不存在"));
        if (actor.getRole() != Role.ADMIN && !Objects.equals(actor.getBranchId(), id)) {
            throw new AccessDeniedException("无权查看该支部");
        }
        return BranchView.from(branch);
    }

    @Transactional
    public BranchView create(UserPrincipal actor, BranchRequest request) {
        assertAdmin(actor);
        Branch branch = new Branch();
        branch.setName(request.name());
        branch.setDescription(request.description());
        return BranchView.from(branchRepository.save(branch));
    }

    @Transactional
    public BranchView update(UserPrincipal actor, Long id, BranchRequest request) {
        assertAdmin(actor);
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("支部不存在"));
        branch.setName(request.name());
        branch.setDescription(request.description());
        return BranchView.from(branchRepository.save(branch));
    }

    @Transactional
    public void delete(UserPrincipal actor, Long id) {
        assertAdmin(actor);
        if (!branchRepository.existsById(id)) {
            throw new IllegalArgumentException("支部不存在");
        }
        branchRepository.deleteById(id);
    }
}
