package com.damo.partyschool.member;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.branch.Branch;
import com.damo.partyschool.branch.BranchRepository;
import com.damo.partyschool.development.DevelopmentRecord;
import com.damo.partyschool.development.DevelopmentRecordRepository;
import com.damo.partyschool.development.DevelopmentStage;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import com.damo.partyschool.user.UserService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberProfileService {

    private final MemberProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final UserService userService;
    private final FloatingContactRecordRepository contactRepository;
    private final DevelopmentRecordRepository devRecordRepository;

    public MemberProfileService(
            MemberProfileRepository profileRepository,
            UserRepository userRepository,
            BranchRepository branchRepository,
            UserService userService,
            FloatingContactRecordRepository contactRepository,
            DevelopmentRecordRepository devRecordRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.userService = userService;
        this.contactRepository = contactRepository;
        this.devRecordRepository = devRecordRepository;
    }

    @Transactional
    public MemberProfileView createOrUpdate(UserPrincipal actor, MemberProfileRequest request) {
        userService.requireAccessibleUser(actor, request.userId());
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
        if (request.floatingStartDate() != null) profile.setFloatingStartDate(request.floatingStartDate());
        if (request.floatingReason() != null) profile.setFloatingReason(request.floatingReason());
        if (request.floatingExpectedReturn() != null) profile.setFloatingExpectedReturn(request.floatingExpectedReturn());
        if (request.floatingContact() != null) profile.setFloatingContact(request.floatingContact());

        profile = profileRepository.save(profile);
        return toView(profile);
    }

    @Transactional(readOnly = true)
    public List<MemberProfileView> listForActor(UserPrincipal actor, Long requestedBranchId) {
        if (actor.getRole() == Role.ADMIN) {
            if (requestedBranchId != null) {
                return listByBranch(requestedBranchId);
            }
            return listAll();
        }
        if (actor.getBranchId() == null) {
            return List.of();
        }
        return listByBranch(actor.getBranchId());
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
        Map<Long, String> stageMap = buildStageMap(userIds);

        List<MemberProfileView> result = new ArrayList<>();
        for (User user : users) {
            MemberProfile profile = profileMap.get(user.getId());
            String branchName = user.getBranchId() != null && branchMap.containsKey(user.getBranchId())
                    ? branchMap.get(user.getBranchId()).getName()
                    : "—";
            String stage = stageMap.get(user.getId());
            if (profile != null) {
                result.add(MemberProfileView.from(profile, user.getName(), user.getBranchId(), branchName, stage));
            } else {
                result.add(new MemberProfileView(
                        null, user.getId(), user.getName(), user.getBranchId(), branchName,
                        null, null, null, null, null, null, null, null, null,
                        null, null, null, null, null, null, null, null, stage));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public MemberProfileView getByUserId(UserPrincipal actor, Long userId) {
        userService.requireAccessibleUser(actor, userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        String branchName = user.getBranchId() != null
                ? branchRepository.findById(user.getBranchId()).map(Branch::getName).orElse("—")
                : "—";

        String stage = resolveStage(userId);
        return profileRepository.findByUserId(userId)
                .map(p -> MemberProfileView.from(p, user.getName(), user.getBranchId(), branchName, stage))
                .orElseGet(() -> new MemberProfileView(
                        null, user.getId(), user.getName(), user.getBranchId(), branchName,
                        null, null, null, null, null, null, null, null, null,
                        null, null, null, null, null, null, null, null, stage));
    }

    @Transactional(readOnly = true)
    public List<MemberProfileView> listFloating(UserPrincipal actor) {
        List<MemberProfile> floating = profileRepository.findByMemberStatus(MemberStatus.FLOATING);
        // Exclude orphaned profiles whose user has been deleted
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        List<MemberProfile> valid = floating.stream()
                .filter(p -> userMap.containsKey(p.getUserId()))
                .toList();
        List<MemberProfileView> all = toViewList(valid);
        if (actor.getRole() == Role.ADMIN) {
            return all;
        }
        if (actor.getBranchId() == null) {
            return List.of();
        }
        return all.stream()
                .filter(v -> Objects.equals(v.branchId(), actor.getBranchId()))
                .toList();
    }

    // ---- helpers ----

    /** 查询某用户当前阶段：取发展记录中最靠后的阶段，同时参考 memberStatus 兜底 */
    private String resolveStage(Long userId) {
        // 取发展记录中阶段推进最靠后的
        int maxDevOrdinal = devRecordRepository.findByUserIdOrderByStartDateAsc(userId)
                .stream()
                .mapToInt(r -> r.getStage().ordinal())
                .max()
                .orElse(-1);
        // 从 memberStatus 推导
        MemberProfile mp = profileRepository.findByUserId(userId).orElse(null);
        int statusOrdinal = -1;
        if (mp != null && mp.getMemberStatus() == MemberStatus.FORMAL) statusOrdinal = DevelopmentStage.FORMAL.ordinal();
        else if (mp != null && mp.getMemberStatus() == MemberStatus.PROBATIONARY) statusOrdinal = DevelopmentStage.PROBATIONARY.ordinal();
        // 取两者中更靠后的
        int best = Math.max(maxDevOrdinal, statusOrdinal);
        if (best >= 0) return DevelopmentStage.values()[best].name();
        return null;
    }

    private Map<Long, String> buildStageMap(List<Long> userIds) {
        Map<Long, String> map = new HashMap<>();
        for (Long uid : userIds) {
            String stage = resolveStage(uid);
            if (stage != null) map.put(uid, stage);
        }
        return map;
    }

    private List<MemberProfileView> toViewList(List<MemberProfile> profiles) {
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<Long, Branch> branchMap = branchRepository.findAll().stream()
                .collect(Collectors.toMap(Branch::getId, b -> b));
        List<Long> userIds = profiles.stream().map(MemberProfile::getUserId).toList();
        Map<Long, String> stageMap = buildStageMap(userIds);

        return profiles.stream()
                .filter(p -> userMap.containsKey(p.getUserId())) // skip orphans
                .map(p -> {
                    User user = userMap.get(p.getUserId());
                    String userName = user.getName();
                    Long branchId = user.getBranchId();
                    String branchName = branchId != null && branchMap.containsKey(branchId)
                            ? branchMap.get(branchId).getName() : "—";
                    return MemberProfileView.from(p, userName, branchId, branchName, stageMap.get(p.getUserId()));
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
        String stage = resolveStage(p.getUserId());
        return MemberProfileView.from(p, userName, branchId, branchName, stage);
    }

    // ---- 流动党员管理 ----

    /** 将党员标记为流动状态 */
    @Transactional
    public MemberProfileView markFloating(UserPrincipal actor, Long userId, MemberProfileRequest request) {
        userService.requireAccessibleUser(actor, userId);
        MemberProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("该党员档案不存在，请先创建档案"));
        profile.setMemberStatus(MemberStatus.FLOATING);
        if (request.floatingLocation() != null) profile.setFloatingLocation(request.floatingLocation());
        if (request.floatingStartDate() != null) profile.setFloatingStartDate(request.floatingStartDate());
        if (request.floatingReason() != null) profile.setFloatingReason(request.floatingReason());
        if (request.floatingExpectedReturn() != null) profile.setFloatingExpectedReturn(request.floatingExpectedReturn());
        if (request.floatingContact() != null) profile.setFloatingContact(request.floatingContact());
        profile = profileRepository.save(profile);
        return toView(profile);
    }

    /** 将流动党员转回正常状态（清除流动相关字段） */
    @Transactional
    public MemberProfileView returnFromFloating(UserPrincipal actor, Long userId) {
        userService.requireAccessibleUser(actor, userId);
        MemberProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("该党员档案不存在"));
        if (profile.getMemberStatus() != MemberStatus.FLOATING) {
            throw new IllegalStateException("该党员当前不是流动状态");
        }
        profile.setMemberStatus(MemberStatus.FORMAL);
        profile.setFloatingLocation(null);
        profile.setFloatingStartDate(null);
        profile.setFloatingReason(null);
        profile.setFloatingExpectedReturn(null);
        profile.setFloatingContact(null);
        profile = profileRepository.save(profile);
        return toView(profile);
    }

    // ---- 流动党员联系记录 ----

    /** 添加联系记录 */
    @Transactional
    public FloatingContactView addFloatingContact(UserPrincipal actor, Long userId, FloatingContactRequest request) {
        userService.requireAccessibleUser(actor, userId);
        FloatingContactRecord record = new FloatingContactRecord();
        record.setUserId(userId);
        record.setContactDate(request.contactDate());
        record.setContactMethod(request.contactMethod());
        record.setSummary(request.summary());
        record = contactRepository.save(record);
        return FloatingContactView.from(record);
    }

    /** 查看联系记录列表 */
    @Transactional(readOnly = true)
    public List<FloatingContactView> listFloatingContacts(UserPrincipal actor, Long userId) {
        userService.requireAccessibleUser(actor, userId);
        return contactRepository.findByUserIdOrderByContactDateDesc(userId).stream()
                .map(FloatingContactView::from)
                .toList();
    }

    /** 编辑联系记录 */
    @Transactional
    public FloatingContactView updateFloatingContact(UserPrincipal actor, Long id, FloatingContactRequest request) {
        FloatingContactRecord record = contactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("联系记录不存在"));
        userService.requireAccessibleUser(actor, record.getUserId());
        if (request.contactDate() != null) record.setContactDate(request.contactDate());
        if (request.contactMethod() != null) record.setContactMethod(request.contactMethod());
        if (request.summary() != null) record.setSummary(request.summary());
        record = contactRepository.save(record);
        return FloatingContactView.from(record);
    }

    /** 删除联系记录 */
    @Transactional
    public void deleteFloatingContact(UserPrincipal actor, Long id) {
        FloatingContactRecord record = contactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("联系记录不存在"));
        userService.requireAccessibleUser(actor, record.getUserId());
        contactRepository.delete(record);
    }
}
