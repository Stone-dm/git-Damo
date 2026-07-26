package com.damo.partyschool.training;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.branch.Branch;
import com.damo.partyschool.branch.BranchRepository;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import com.damo.partyschool.user.UserService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainingService {

    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final TrainingPlanRepository planRepository;
    private final TrainingRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final UserService userService;

    public TrainingService(
            TrainingPlanRepository planRepository,
            TrainingRecordRepository recordRepository,
            UserRepository userRepository,
            BranchRepository branchRepository,
            UserService userService) {
        this.planRepository = planRepository;
        this.recordRepository = recordRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.userService = userService;
    }

    // ---- Plans ----

    @Transactional
    public TrainingPlanView createPlan(TrainingPlanRequest request) {
        TrainingPlan plan = new TrainingPlan();
        plan.setTitle(request.title().trim());
        plan.setDescription(request.description());
        plan.setPlanType(request.planType());
        if (request.status() != null) plan.setStatus(request.status());
        if (request.deadline() != null && !request.deadline().isBlank())
            plan.setDeadline(LocalDate.parse(request.deadline()));
        if (request.relatedStage() != null) plan.setRelatedStage(request.relatedStage());
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
    public TrainingPlanView publishPlan(Long id, String status) {
        TrainingPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("培养计划不存在"));
        if (!"DRAFT".equals(status) && !"ACTIVE".equals(status)) {
            throw new IllegalArgumentException("无效的状态: " + status);
        }
        plan.setStatus(status);
        return TrainingPlanView.from(planRepository.save(plan));
    }

    @Transactional
    public void deletePlan(Long id) {
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
        record.setCompletedAt(LocalDateTime.now());
        record = recordRepository.save(record);
        return toView(record);
    }

    @Transactional(readOnly = true)
    public List<TrainingRecordView> listRecordsByPlan(UserPrincipal actor, Long planId) {
        List<TrainingRecordView> views = recordRepository.findByPlanId(planId).stream()
                .map(this::toView)
                .toList();
        if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() == null) return List.of();
            Set<Long> ownMemberIds = userRepository.findByBranchIdAndRole(actor.getBranchId(), Role.MEMBER)
                    .stream().map(User::getId).collect(Collectors.toSet());
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

    /** 批量分配：将计划分配给指定支部的全部 MEMBER 党员 */
    @Transactional
    public int batchAssign(Long planId, List<Long> branchIds) {
        List<Long> existingUserIds = recordRepository.findByPlanId(planId).stream()
                .map(TrainingRecord::getUserId).toList();
        int assigned = 0;
        for (Long branchId : branchIds) {
            List<User> members = userRepository.findByBranchIdAndRole(branchId, Role.MEMBER);
            for (User member : members) {
                if (!existingUserIds.contains(member.getId())) {
                    TrainingRecord record = new TrainingRecord();
                    record.setPlanId(planId);
                    record.setUserId(member.getId());
                    record.setCompleted(false);
                    recordRepository.save(record);
                    assigned++;
                }
            }
        }
        return assigned;
    }

    // ---- helpers ----

    private TrainingRecordView toView(TrainingRecord r) {
        User user = userRepository.findById(r.getUserId()).orElse(null);
        TrainingPlan plan = planRepository.findById(r.getPlanId()).orElse(null);
        String branchName = "—";
        Long branchId = null;
        if (user != null && user.getBranchId() != null) {
            branchId = user.getBranchId();
            branchName = branchRepository.findById(branchId).map(Branch::getName).orElse("—");
        }
        return new TrainingRecordView(
                r.getId(),
                r.getPlanId(),
                plan != null ? plan.getTitle() : "—",
                r.getUserId(),
                user != null ? user.getName() : "—",
                branchId,
                branchName,
                r.isCompleted(),
                r.getCompletedAt() != null ? r.getCompletedAt().format(DATETIME_FMT) : null);
    }
}
