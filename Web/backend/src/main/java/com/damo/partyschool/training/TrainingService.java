package com.damo.partyschool.training;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import com.damo.partyschool.user.UserService;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainingService {

    private final TrainingPlanRepository planRepository;
    private final TrainingRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public TrainingService(
            TrainingPlanRepository planRepository,
            TrainingRecordRepository recordRepository,
            UserRepository userRepository,
            UserService userService) {
        this.planRepository = planRepository;
        this.recordRepository = recordRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // ---- Plans ----

    @Transactional
    public TrainingPlanView createPlan(TrainingPlanRequest request) {
        TrainingPlan plan = new TrainingPlan();
        plan.setTitle(request.title().trim());
        plan.setDescription(request.description());
        plan.setPlanType(request.planType());
        plan = planRepository.save(plan);
        return TrainingPlanView.from(plan);
    }

    @Transactional(readOnly = true)
    public List<TrainingPlanView> listPlans() {
        return planRepository.findAll().stream()
                .map(TrainingPlanView::from)
                .toList();
    }

    @Transactional
    public void deletePlan(Long id) {
        // also delete all records for this plan
        List<TrainingRecord> records = recordRepository.findByPlanId(id);
        recordRepository.deleteAll(records);
        planRepository.deleteById(id);
    }

    // ---- Records ----

    @Transactional
    public TrainingRecordView markComplete(UserPrincipal actor, Long planId, Long userId) {
        userService.requireAccessibleUser(actor, userId);
        TrainingRecord record = new TrainingRecord();
        record.setPlanId(planId);
        record.setUserId(userId);
        record.setCompleted(true);
        record.setCompletedAt(java.time.LocalDateTime.now());
        record = recordRepository.save(record);
        return toView(record);
    }

    @Transactional(readOnly = true)
    public List<TrainingRecordView> listRecordsByPlan(UserPrincipal actor, Long planId) {
        List<TrainingRecordView> views = recordRepository.findByPlanId(planId).stream()
                .map(this::toView)
                .toList();
        if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() == null) {
                return List.of();
            }
            Set<Long> ownMemberIds = userRepository.findByBranchIdAndRole(actor.getBranchId(), Role.MEMBER)
                    .stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());
            return views.stream().filter(v -> ownMemberIds.contains(v.userId())).toList();
        }
        return views;
    }

    @Transactional(readOnly = true)
    public List<TrainingRecordView> listRecordsByUser(UserPrincipal actor, Long userId) {
        userService.requireAccessibleUser(actor, userId);
        return recordRepository.findByUserId(userId).stream()
                .map(this::toView)
                .toList();
    }

    // ---- helpers ----

    private TrainingRecordView toView(TrainingRecord r) {
        User user = userRepository.findById(r.getUserId()).orElse(null);
        TrainingPlan plan = planRepository.findById(r.getPlanId()).orElse(null);
        return new TrainingRecordView(
                r.getId(),
                r.getPlanId(),
                plan != null ? plan.getTitle() : "—",
                r.getUserId(),
                user != null ? user.getName() : "—",
                r.isCompleted(),
                r.getCompletedAt());
    }
}
