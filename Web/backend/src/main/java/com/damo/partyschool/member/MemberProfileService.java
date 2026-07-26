package com.damo.partyschool.member;

import com.damo.partyschool.branch.Branch;
import com.damo.partyschool.branch.BranchRepository;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberProfileService {

    private final MemberProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public MemberProfileService(
            MemberProfileRepository profileRepository,
            UserRepository userRepository,
            BranchRepository branchRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional
    public MemberProfileView createOrUpdate(MemberProfileRequest request) {
        MemberProfile profile = profileRepository.findByUserId(request.userId())
                .orElseGet(MemberProfile::new);

        profile.setUserId(request.userId());
        if (request.gender() != null) profile.setGender(request.gender());
        if (request.ethnicity() != null) profile.setEthnicity(request.ethnicity());
        if (request.birthDate() != null) profile.setBirthDate(request.birthDate());
        if (request.idCard() != null) profile.setIdCard(request.idCard());
        if (request.phone() != null) profile.setPhone(request.phone());
        if (request.education() != null) profile.setEducation(request.education());
        if (request.degree() != null) profile.setDegree(request.degree());
        if (request.workplace() != null) profile.setWorkplace(request.workplace());
        if (request.position() != null) profile.setPosition(request.position());
        if (request.joinDate() != null) profile.setJoinDate(request.joinDate());
        if (request.formalDate() != null) profile.setFormalDate(request.formalDate());
        if (request.memberStatus() != null) profile.setMemberStatus(request.memberStatus());
        if (request.floatingLocation() != null) profile.setFloatingLocation(request.floatingLocation());

        profile = profileRepository.save(profile);
        return toView(profile);
    }

    @Transactional(readOnly = true)
    public List<MemberProfileView> listAll() {
        // Return ALL users with role MEMBER, with or without profile
        List<User> allMembers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.damo.partyschool.user.Role.MEMBER)
                .toList();
        return buildProfileViews(allMembers);
    }

    @Transactional(readOnly = true)
    public List<MemberProfileView> listByBranch(Long branchId) {
        List<User> usersInBranch = userRepository.findAll().stream()
                .filter(u -> branchId.equals(u.getBranchId())
                        && u.getRole() == com.damo.partyschool.user.Role.MEMBER)
                .toList();
        return buildProfileViews(usersInBranch);
    }

    private List<MemberProfileView> buildProfileViews(List<User> users) {
        List<Long> userIds = users.stream().map(User::getId).toList();
        Map<Long, MemberProfile> profileMap = profileRepository.findAll().stream()
                .filter(p -> userIds.contains(p.getUserId()))
                .collect(Collectors.toMap(MemberProfile::getUserId, p -> p));
        Map<Long, Branch> branchMap = branchRepository.findAll().stream()
                .collect(Collectors.toMap(Branch::getId, b -> b));

        List<MemberProfileView> result = new ArrayList<>();
        for (User user : users) {
            MemberProfile profile = profileMap.get(user.getId());
            String branchName = user.getBranchId() != null && branchMap.containsKey(user.getBranchId())
                    ? branchMap.get(user.getBranchId()).getName()
                    : "—";
            if (profile != null) {
                result.add(MemberProfileView.from(profile, user.getName(), user.getBranchId(), branchName));
            } else {
                result.add(new MemberProfileView(
                        null, user.getId(), user.getName(), user.getBranchId(), branchName,
                        null, null, null, null, null, null, null, null, null,
                        null, null, null, null));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public MemberProfileView getByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        String branchName = user.getBranchId() != null
                ? branchRepository.findById(user.getBranchId()).map(Branch::getName).orElse("—")
                : "—";

        return profileRepository.findByUserId(userId)
                .map(p -> MemberProfileView.from(p, user.getName(), user.getBranchId(), branchName))
                .orElseGet(() -> new MemberProfileView(
                        null, user.getId(), user.getName(), user.getBranchId(), branchName,
                        null, null, null, null, null, null, null, null, null,
                        null, null, null, null));
    }

    @Transactional(readOnly = true)
    public List<MemberProfileView> listFloating() {
        List<MemberProfile> floating = profileRepository.findByMemberStatus(MemberStatus.FLOATING);
        // Exclude orphaned profiles whose user has been deleted
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        List<MemberProfile> valid = floating.stream()
                .filter(p -> userMap.containsKey(p.getUserId()))
                .toList();
        return toViewList(valid);
    }

    // ---- helpers ----

    private List<MemberProfileView> toViewList(List<MemberProfile> profiles) {
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<Long, Branch> branchMap = branchRepository.findAll().stream()
                .collect(Collectors.toMap(Branch::getId, b -> b));

        return profiles.stream()
                .filter(p -> userMap.containsKey(p.getUserId())) // skip orphans
                .map(p -> {
                    User user = userMap.get(p.getUserId());
                    String userName = user.getName();
                    Long branchId = user.getBranchId();
                    String branchName = branchId != null && branchMap.containsKey(branchId)
                            ? branchMap.get(branchId).getName() : "—";
                    return MemberProfileView.from(p, userName, branchId, branchName);
                })
                .toList();
    }

    private MemberProfileView toView(MemberProfile p) {
        User user = userRepository.findById(p.getUserId()).orElse(null);
        String userName = user != null ? user.getName() : "—";
        Long branchId = user != null ? user.getBranchId() : null;
        String branchName = "—";
        if (branchId != null) {
            branchName = branchRepository.findById(branchId).map(Branch::getName).orElse("—");
        }
        return MemberProfileView.from(p, userName, branchId, branchName);
    }
}
