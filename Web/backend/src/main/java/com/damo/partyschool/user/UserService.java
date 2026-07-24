package com.damo.partyschool.user;

import java.util.List;
import java.util.Objects;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.auth.UserView;
import com.damo.partyschool.branch.BranchService;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchService branchService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            BranchService branchService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.branchService = branchService;
    }

    @Transactional(readOnly = true)
    public List<UserView> list(UserPrincipal actor) {
        return switch (actor.getRole()) {
            case ADMIN -> userRepository.findAll().stream().map(UserView::from).toList();
            case SECRETARY -> {
                if (actor.getBranchId() == null) {
                    yield List.of();
                }
                yield userRepository.findByBranchIdAndRole(actor.getBranchId(), Role.MEMBER).stream()
                        .map(UserView::from)
                        .toList();
            }
            case MEMBER -> userRepository.findById(actor.getId())
                    .map(u -> List.of(UserView.from(u)))
                    .orElse(List.of());
        };
    }

    @Transactional(readOnly = true)
    public UserView get(UserPrincipal actor, Long id) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        assertCanView(actor, target);
        return UserView.from(target);
    }

    @Transactional
    public UserView create(UserPrincipal actor, UserRequest request) {
        assertCanWrite(actor, request.role(), request.branchId(), null);
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("用户名已存在");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("密码不能为空");
        }
        User user = new User();
        apply(user, request, true);
        return UserView.from(userRepository.save(user));
    }

    @Transactional
    public UserView update(UserPrincipal actor, Long id, UserRequest request) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        assertCanWrite(actor, request.role(), request.branchId(), target);
        if (!Objects.equals(target.getUsername(), request.username())
                && userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("用户名已存在");
        }
        apply(target, request, request.password() != null && !request.password().isBlank());
        return UserView.from(userRepository.save(target));
    }

    @Transactional
    public void delete(UserPrincipal actor, Long id) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        assertCanWrite(actor, target.getRole(), target.getBranchId(), target);
        userRepository.delete(target);
    }

    private void apply(User user, UserRequest request, boolean setPassword) {
        user.setUsername(request.username());
        user.setName(request.name());
        user.setRole(request.role());
        user.setBranchId(request.branchId());
        if (setPassword) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
    }

    private void assertCanView(UserPrincipal actor, User target) {
        switch (actor.getRole()) {
            case ADMIN -> {
            }
            case SECRETARY -> {
                if (target.getRole() != Role.MEMBER
                        || !Objects.equals(actor.getBranchId(), target.getBranchId())) {
                    throw new AccessDeniedException("无权查看该用户");
                }
            }
            case MEMBER -> {
                if (!Objects.equals(actor.getId(), target.getId())) {
                    throw new AccessDeniedException("无权查看该用户");
                }
            }
        }
    }

    private void assertCanWrite(UserPrincipal actor, Role targetRole, Long targetBranchId, User existing) {
        switch (actor.getRole()) {
            case ADMIN -> {
            }
            case SECRETARY -> {
                if (existing != null && existing.getRole() != Role.MEMBER) {
                    throw new AccessDeniedException("书记仅可管理本支部党员");
                }
                if (targetRole != Role.MEMBER) {
                    throw new AccessDeniedException("书记仅可管理本支部党员");
                }
                User actorEntity = toActorUser(actor);
                branchService.assertCanManageBranch(actorEntity, targetBranchId);
                if (existing != null) {
                    branchService.assertCanManageBranch(actorEntity, existing.getBranchId());
                }
            }
            case MEMBER -> throw new AccessDeniedException("党员无权管理用户");
        }
    }

    private User toActorUser(UserPrincipal actor) {
        User user = new User();
        user.setId(actor.getId());
        user.setRole(actor.getRole());
        user.setBranchId(actor.getBranchId());
        return user;
    }
}
