package com.damo.partyschool.cultivation;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.member.MemberProfile;
import com.damo.partyschool.member.MemberProfileRepository;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import com.damo.partyschool.user.UserService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CultivationContactService {

    private final CultivationContactRepository repository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final MemberProfileRepository profileRepository;

    public CultivationContactService(
            CultivationContactRepository repository,
            UserRepository userRepository,
            UserService userService,
            MemberProfileRepository profileRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.profileRepository = profileRepository;
    }

    /** 分配培养联系人 */
    @Transactional
    public CultivationContactView create(UserPrincipal actor, CultivationContactRequest request) {
        requireManagePermission(actor);
        User mentor = userRepository.findById(request.mentorUserId())
                .orElseThrow(() -> new IllegalArgumentException("培养联系人用户不存在"));
        User trainee = userRepository.findById(request.traineeUserId())
                .orElseThrow(() -> new IllegalArgumentException("被培养党员用户不存在"));

        CultivationContact c = new CultivationContact();
        c.setMentorUserId(request.mentorUserId());
        c.setTraineeUserId(request.traineeUserId());
        c.setRole(request.role());
        if (request.startDate() != null && !request.startDate().isBlank())
            c.setStartDate(LocalDate.parse(request.startDate()));
        if (request.endDate() != null && !request.endDate().isBlank())
            c.setEndDate(LocalDate.parse(request.endDate()));
        c.setNotes(request.notes());
        c = repository.save(c);

        String phone = profileRepository.findByUserId(mentor.getId())
                .map(MemberProfile::getPhone).orElse(null);
        return CultivationContactView.from(c, mentor.getName(), phone);
    }

    /** 查看某党员的培养联系人 */
    @Transactional(readOnly = true)
    public List<CultivationContactView> listByTrainee(UserPrincipal actor, Long userId) {
        userService.requireAccessibleUser(actor, userId);
        return repository.findByTraineeUserId(userId).stream()
                .map(c -> {
                    User mentor = userRepository.findById(c.getMentorUserId()).orElse(null);
                    String phone = mentor != null
                            ? profileRepository.findByUserId(mentor.getId()).map(MemberProfile::getPhone).orElse(null)
                            : null;
                    return CultivationContactView.from(c,
                            mentor != null ? mentor.getName() : "—",
                            phone);
                })
                .toList();
    }

    /** 移除培养联系人 */
    @Transactional
    public void delete(UserPrincipal actor, Long id) {
        requireManagePermission(actor);
        repository.findById(id).orElseThrow(() -> new IllegalArgumentException("记录不存在"));
        repository.deleteById(id);
    }

    private void requireManagePermission(UserPrincipal actor) {
        if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.SECRETARY) return;
        throw new SecurityException("无权操作培养联系人");
    }
}
