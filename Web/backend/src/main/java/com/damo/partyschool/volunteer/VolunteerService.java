package com.damo.partyschool.volunteer;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VolunteerService {

    private final VolunteerActivityRepository activityRepository;
    private final VolunteerSignupRepository signupRepository;
    private final UserRepository userRepository;

    public VolunteerService(
            VolunteerActivityRepository activityRepository,
            VolunteerSignupRepository signupRepository,
            UserRepository userRepository) {
        this.activityRepository = activityRepository;
        this.signupRepository = signupRepository;
        this.userRepository = userRepository;
    }

    // ---- Activity CRUD ----

    @Transactional
    public VolunteerActivityView createActivity(UserPrincipal actor, VolunteerActivityRequest request) {
        assertCanManage(actor);

        VolunteerActivity activity = new VolunteerActivity();
        activity.setTitle(request.title().trim());
        activity.setDescription(request.description());
        activity.setLocation(request.location());
        activity.setStartTime(request.startTime());
        activity.setEndTime(request.endTime());
        activity.setMaxParticipants(request.maxParticipants());
        activity.setOrganizerId(actor.getId());
        activity.setStatus(ActivityStatus.DRAFT);

        activity = activityRepository.save(activity);
        return VolunteerActivityView.from(activity, 0);
    }

    @Transactional(readOnly = true)
    public List<VolunteerActivityView> listActivities(
            UserPrincipal actor, ActivityStatus status, LocalDateTime dateFrom, LocalDateTime dateTo) {
        requireAuth(actor);

        Specification<VolunteerActivity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), dateFrom));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startTime"), dateTo));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<VolunteerActivity> activities;
        if (status != null || dateFrom != null || dateTo != null) {
            activities = activityRepository.findAll(spec);
        } else {
            activities = activityRepository.findAll();
        }

        // sort by startTime descending
        activities.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));

        return activities.stream()
                .map(a -> VolunteerActivityView.from(a, signupRepository.countByActivityId(a.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public VolunteerActivityView getActivity(UserPrincipal actor, Long id) {
        requireAuth(actor);
        VolunteerActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
        return VolunteerActivityView.from(activity, signupRepository.countByActivityId(activity.getId()));
    }

    @Transactional
    public VolunteerActivityView updateActivity(UserPrincipal actor, Long id, VolunteerActivityRequest request) {
        VolunteerActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
        assertCanManageActivity(actor, activity);

        if (activity.getStatus() == ActivityStatus.FINISHED
                || activity.getStatus() == ActivityStatus.CANCELLED) {
            throw new IllegalArgumentException("已结束或已取消的活动不可编辑");
        }

        activity.setTitle(request.title().trim());
        activity.setDescription(request.description());
        activity.setLocation(request.location());
        activity.setStartTime(request.startTime());
        activity.setEndTime(request.endTime());
        activity.setMaxParticipants(request.maxParticipants());

        activity = activityRepository.save(activity);
        return VolunteerActivityView.from(activity, signupRepository.countByActivityId(activity.getId()));
    }

    @Transactional
    public void deleteActivity(UserPrincipal actor, Long id) {
        VolunteerActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
        assertCanManageActivity(actor, activity);

        if (activity.getStatus() != ActivityStatus.DRAFT
                && activity.getStatus() != ActivityStatus.CANCELLED) {
            throw new IllegalArgumentException("只能删除草稿或已取消的活动");
        }

        List<VolunteerSignup> signups = signupRepository.findByActivityId(id);
        signupRepository.deleteAll(signups);
        activityRepository.delete(activity);
    }

    // ---- Status transitions ----

    @Transactional
    public VolunteerActivityView publishActivity(UserPrincipal actor, Long id) {
        VolunteerActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
        assertCanManageActivity(actor, activity);

        if (activity.getStatus() != ActivityStatus.DRAFT) {
            throw new IllegalArgumentException("只能发布草稿状态的活动");
        }

        activity.setStatus(ActivityStatus.PUBLISHED);
        activity = activityRepository.save(activity);
        return VolunteerActivityView.from(activity, signupRepository.countByActivityId(activity.getId()));
    }

    @Transactional
    public VolunteerActivityView finishActivity(UserPrincipal actor, Long id) {
        VolunteerActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
        assertCanManageActivity(actor, activity);

        if (activity.getStatus() != ActivityStatus.ONGOING
                && activity.getStatus() != ActivityStatus.PUBLISHED) {
            throw new IllegalArgumentException("只能结束进行中或已发布的活动");
        }

        activity.setStatus(ActivityStatus.FINISHED);
        activity = activityRepository.save(activity);
        return VolunteerActivityView.from(activity, signupRepository.countByActivityId(activity.getId()));
    }

    // ---- Signup ----

    @Transactional
    public VolunteerSignupView signup(UserPrincipal actor, Long activityId) {
        if (actor.getRole() != Role.MEMBER) {
            throw new AccessDeniedException("仅党员可报名活动");
        }

        VolunteerActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));

        if (activity.getStatus() != ActivityStatus.PUBLISHED
                && activity.getStatus() != ActivityStatus.ONGOING) {
            throw new IllegalArgumentException("活动当前不可报名");
        }

        // check if already signed up
        signupRepository.findByActivityIdAndUserId(activityId, actor.getId())
                .ifPresent(s -> {
                    throw new IllegalArgumentException("您已报名该活动");
                });

        // check max participants
        if (activity.getMaxParticipants() != null) {
            long currentCount = signupRepository.countByActivityId(activityId);
            if (currentCount >= activity.getMaxParticipants()) {
                throw new IllegalArgumentException("报名人数已达上限");
            }
        }

        VolunteerSignup signup = new VolunteerSignup();
        signup.setActivityId(activityId);
        signup.setUserId(actor.getId());
        signup.setStatus(SignupStatus.SIGNED_UP);

        signup = signupRepository.save(signup);

        User user = userRepository.findById(actor.getId()).orElse(null);
        String userName = user != null ? user.getName() : "未知用户";

        return new VolunteerSignupView(
                signup.getId(),
                signup.getActivityId(),
                signup.getUserId(),
                userName,
                signup.getStatus(),
                signup.getServiceHours(),
                signup.getNotes(),
                signup.getSignedUpAt(),
                signup.getParticipatedAt());
    }

    @Transactional
    public void cancelSignup(UserPrincipal actor, Long activityId) {
        VolunteerSignup signup = signupRepository.findByActivityIdAndUserId(activityId, actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("未报名该活动"));

        // member can only cancel their own signup
        if (!signup.getUserId().equals(actor.getId())) {
            throw new AccessDeniedException("只能取消自己的报名");
        }

        VolunteerActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));

        if (activity.getStatus() == ActivityStatus.FINISHED) {
            throw new IllegalArgumentException("活动已结束，不可取消报名");
        }

        signupRepository.delete(signup);
    }

    @Transactional(readOnly = true)
    public List<VolunteerSignupView> listSignups(UserPrincipal actor, Long activityId) {
        VolunteerActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
        assertCanManageActivity(actor, activity);

        List<VolunteerSignup> signups = signupRepository.findByActivityId(activityId);

        Map<Long, String> userNames = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        return signups.stream()
                .map(s -> new VolunteerSignupView(
                        s.getId(),
                        s.getActivityId(),
                        s.getUserId(),
                        userNames.getOrDefault(s.getUserId(), "未知用户"),
                        s.getStatus(),
                        s.getServiceHours(),
                        s.getNotes(),
                        s.getSignedUpAt(),
                        s.getParticipatedAt()))
                .toList();
    }

    // ---- Attendance ----

    @Transactional
    public VolunteerSignupView attend(UserPrincipal actor, Long signupId, Double serviceHours) {
        assertCanManage(actor);

        VolunteerSignup signup = signupRepository.findById(signupId)
                .orElseThrow(() -> new IllegalArgumentException("报名记录不存在"));

        VolunteerActivity activity = activityRepository.findById(signup.getActivityId())
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
        assertCanManageActivity(actor, activity);

        if (signup.getStatus() != SignupStatus.SIGNED_UP) {
            throw new IllegalArgumentException("该报名已记录参与状态");
        }

        signup.setStatus(SignupStatus.PARTICIPATED);
        signup.setServiceHours(serviceHours);
        signup.setParticipatedAt(LocalDateTime.now());

        signup = signupRepository.save(signup);

        User user = userRepository.findById(signup.getUserId()).orElse(null);
        String userName = user != null ? user.getName() : "未知用户";

        return new VolunteerSignupView(
                signup.getId(),
                signup.getActivityId(),
                signup.getUserId(),
                userName,
                signup.getStatus(),
                signup.getServiceHours(),
                signup.getNotes(),
                signup.getSignedUpAt(),
                signup.getParticipatedAt());
    }

    // ---- Stats ----

    @Transactional(readOnly = true)
    public VolunteerStats getStats(UserPrincipal actor) {
        requireAuth(actor);

        long totalActivities = activityRepository.count();

        List<VolunteerSignup> allSignups = signupRepository.findAll();
        long totalParticipations = allSignups.stream()
                .filter(s -> s.getStatus() == SignupStatus.PARTICIPATED)
                .count();

        double totalServiceHours = allSignups.stream()
                .filter(s -> s.getStatus() == SignupStatus.PARTICIPATED && s.getServiceHours() != null)
                .mapToDouble(VolunteerSignup::getServiceHours)
                .sum();

        return new VolunteerStats(totalActivities, totalParticipations, totalServiceHours);
    }

    // ---- helpers ----

    private void requireAuth(UserPrincipal actor) {
        if (actor == null) {
            throw new AccessDeniedException("未登录");
        }
    }

    private void assertCanManage(UserPrincipal actor) {
        requireAuth(actor);
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.SECRETARY) {
            throw new AccessDeniedException("仅管理员和书记可执行此操作");
        }
    }

    private void assertCanManageActivity(UserPrincipal actor, VolunteerActivity activity) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }
        if (actor.getRole() == Role.SECRETARY) {
            // secretary can manage if they are the organizer or in the same branch
            if (activity.getOrganizerId().equals(actor.getId())) {
                return;
            }
            // also allow if secretary manages the same branch (check via activity organizer's branch)
            User organizer = userRepository.findById(activity.getOrganizerId()).orElse(null);
            if (organizer != null && organizer.getBranchId() != null
                    && organizer.getBranchId().equals(actor.getBranchId())) {
                return;
            }
        }
        throw new AccessDeniedException("无权操作该活动");
    }
}
