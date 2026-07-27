package com.damo.partyschool.partydues;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.branch.Branch;
import com.damo.partyschool.branch.BranchRepository;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PartyDuesService {

    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final PartyDuesStandardRepository standardRepository;
    private final PartyDuesRecordRepository recordRepository;
    private final PartyDuesReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PartyDuesExcelParser excelParser;

    public PartyDuesService(
            PartyDuesStandardRepository standardRepository,
            PartyDuesRecordRepository recordRepository,
            PartyDuesReminderRepository reminderRepository,
            UserRepository userRepository,
            BranchRepository branchRepository,
            PartyDuesExcelParser excelParser) {
        this.standardRepository = standardRepository;
        this.recordRepository = recordRepository;
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.excelParser = excelParser;
    }

    @Transactional
    public PartyDuesStandardView createStandard(UserPrincipal actor, PartyDuesStandardRequest request) {
        assertCanManage(actor);
        PartyDuesStandard standard = buildStandard(actor, new PartyDuesStandard(), request);
        return toStandardView(standardRepository.save(standard), userMap(), branchMap());
    }

    @Transactional
    public PartyDuesImportResult importStandards(UserPrincipal actor, MultipartFile file) {
        assertCanManage(actor);
        try {
            PartyDuesExcelParser.ParseResult parsed = excelParser.parse(file.getInputStream());
            List<String> errors = new ArrayList<>(parsed.errors());
            List<PartyDuesStandardView> views = new ArrayList<>();
            Map<Long, User> users = userMap();
            Map<Long, Branch> branches = branchMap();

            for (int i = 0; i < parsed.standards().size(); i++) {
                try {
                    PartyDuesStandard standard = buildStandard(actor, new PartyDuesStandard(), parsed.standards().get(i));
                    views.add(toStandardView(standardRepository.save(standard), users, branches));
                } catch (Exception e) {
                    errors.add("Imported row " + (i + 2) + ": " + e.getMessage());
                }
            }
            return new PartyDuesImportResult(views.size(), errors, views);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to import standards: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<PartyDuesStandardView> listStandards(UserPrincipal actor, Long branchId) {
        requireAuth(actor);
        if (actor.getRole() == Role.MEMBER) {
            return standardRepository.findByUserId(actor.getId()).stream()
                    .map(s -> toStandardView(s, userMap(), branchMap()))
                    .toList();
        }

        Long effectiveBranchId = branchId;
        if (actor.getRole() == Role.SECRETARY) {
            effectiveBranchId = requireActorBranch(actor);
            if (branchId != null && !Objects.equals(branchId, effectiveBranchId)) {
                throw new AccessDeniedException("Secretary can only manage own branch");
            }
        }

        List<PartyDuesStandard> standards = effectiveBranchId != null
                ? standardRepository.findByBranchId(effectiveBranchId)
                : standardRepository.findAll();
        Map<Long, User> users = userMap();
        Map<Long, Branch> branches = branchMap();
        return standards.stream()
                .sorted(Comparator.comparing(PartyDuesStandard::getEffectiveDate).reversed())
                .map(s -> toStandardView(s, users, branches))
                .toList();
    }

    @Transactional
    public PartyDuesStandardView updateStandard(UserPrincipal actor, Long id, PartyDuesStandardRequest request) {
        assertCanManage(actor);
        PartyDuesStandard standard = standardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Party dues standard not found"));
        assertBranchManageable(actor, standard.getBranchId());
        standard = buildStandard(actor, standard, request);
        return toStandardView(standardRepository.save(standard), userMap(), branchMap());
    }

    @Transactional
    public List<PartyDuesRecordView> generateRecords(UserPrincipal actor, String yearMonth) {
        assertCanManage(actor);
        YearMonth target = parseYearMonth(yearMonth);
        LocalDate monthEnd = target.atEndOfMonth();

        List<User> members = actor.getRole() == Role.SECRETARY
                ? userRepository.findByBranchIdAndRole(requireActorBranch(actor), Role.MEMBER)
                : userRepository.findAll().stream().filter(u -> u.getRole() == Role.MEMBER).toList();

        Map<Long, PartyDuesStandard> latestStandards = latestStandards(monthEnd);
        List<PartyDuesRecordView> generated = new ArrayList<>();
        Map<Long, User> users = userMap();
        Map<Long, Branch> branches = branchMap();

        for (User member : members) {
            if (recordRepository.findByUserIdAndYearMonth(member.getId(), yearMonth).isPresent()) {
                continue;
            }
            PartyDuesStandard standard = latestStandards.get(member.getId());
            if (standard == null) {
                continue;
            }
            PartyDuesRecord record = new PartyDuesRecord();
            record.setUserId(member.getId());
            record.setBranchId(standard.getBranchId());
            record.setYearMonth(yearMonth);
            record.setDueAmount(standard.getStatus() == PartyDuesStandardStatus.WAIVED ? ZERO : money(standard.getMonthlyAmount()));
            record.setPaidAmount(ZERO);
            record.setStatus(standard.getStatus() == PartyDuesStandardStatus.WAIVED
                    ? PartyDuesRecordStatus.WAIVED
                    : PartyDuesRecordStatus.UNPAID);
            record.setNotes(standard.getStatus() == PartyDuesStandardStatus.WAIVED ? "Waived by standard" : null);
            generated.add(toRecordView(recordRepository.save(record), users, branches));
        }
        return generated;
    }

    @Transactional(readOnly = true)
    public List<PartyDuesRecordView> listRecords(
            UserPrincipal actor, Long branchId, String yearMonth, PartyDuesRecordStatus status) {
        requireAuth(actor);
        if (actor.getRole() == Role.MEMBER) {
            return recordRepository.findByUserIdOrderByYearMonthDesc(actor.getId()).stream()
                    .filter(r -> yearMonth == null || yearMonth.equals(r.getYearMonth()))
                    .filter(r -> status == null || status == r.getStatus())
                    .map(r -> toRecordView(r, userMap(), branchMap()))
                    .toList();
        }

        Long effectiveBranchId = branchId;
        if (actor.getRole() == Role.SECRETARY) {
            effectiveBranchId = requireActorBranch(actor);
            if (branchId != null && !Objects.equals(branchId, effectiveBranchId)) {
                throw new AccessDeniedException("Secretary can only query own branch records");
            }
        }

        Long specBranchId = effectiveBranchId;
        Specification<PartyDuesRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (specBranchId != null) {
                predicates.add(cb.equal(root.get("branchId"), specBranchId));
            }
            if (yearMonth != null && !yearMonth.isBlank()) {
                predicates.add(cb.equal(root.get("yearMonth"), yearMonth));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Map<Long, User> users = userMap();
        Map<Long, Branch> branches = branchMap();
        return recordRepository.findAll(spec).stream()
                .sorted(Comparator.comparing(PartyDuesRecord::getYearMonth).reversed())
                .map(r -> toRecordView(r, users, branches))
                .toList();
    }

    @Transactional
    public PartyDuesRecordView markPaid(UserPrincipal actor, Long id, PartyDuesPayRequest request) {
        assertCanManage(actor);
        PartyDuesRecord record = getManageableRecord(actor, id);
        applyPayment(record, request.paidAmount(), request.notes());
        return toRecordView(recordRepository.save(record), userMap(), branchMap());
    }

    @Transactional
    public List<PartyDuesRecordView> batchMarkPaid(UserPrincipal actor, PartyDuesBatchPayRequest request) {
        assertCanManage(actor);
        Map<Long, User> users = userMap();
        Map<Long, Branch> branches = branchMap();
        return request.recordIds().stream()
                .map(id -> {
                    PartyDuesRecord record = getManageableRecord(actor, id);
                    applyPayment(record, request.paidAmount(), request.notes());
                    return toRecordView(recordRepository.save(record), users, branches);
                })
                .toList();
    }

    @Transactional
    public PartyDuesRecordView remind(UserPrincipal actor, Long id) {
        assertCanManage(actor);
        PartyDuesRecord record = getManageableRecord(actor, id);
        if (record.getStatus() != PartyDuesRecordStatus.UNPAID) {
            throw new IllegalArgumentException("Only unpaid records can be reminded");
        }
        upsertReminder(record);
        return toRecordView(record, userMap(), branchMap());
    }

    @Transactional
    public List<PartyDuesRecordView> batchRemind(UserPrincipal actor, PartyDuesBatchRemindRequest request) {
        assertCanManage(actor);
        Map<Long, User> users = userMap();
        Map<Long, Branch> branches = branchMap();
        return request.recordIds().stream()
                .map(id -> {
                    PartyDuesRecord record = getManageableRecord(actor, id);
                    if (record.getStatus() != PartyDuesRecordStatus.UNPAID) {
                        throw new IllegalArgumentException("Only unpaid records can be reminded");
                    }
                    upsertReminder(record);
                    return toRecordView(record, users, branches);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PartyDuesStatsView stats(UserPrincipal actor, String yearMonth) {
        List<PartyDuesRecord> records = listRecords(actor, null, yearMonth, null).stream()
                .map(v -> recordRepository.findById(v.id()).orElseThrow())
                .toList();
        BigDecimal totalDue = records.stream().map(PartyDuesRecord::getDueAmount).reduce(ZERO, BigDecimal::add);
        BigDecimal totalPaid = records.stream().map(PartyDuesRecord::getPaidAmount).reduce(ZERO, BigDecimal::add);
        long payableCount = records.stream().filter(r -> r.getStatus() != PartyDuesRecordStatus.WAIVED).count();
        long paidCount = records.stream().filter(r -> r.getStatus() == PartyDuesRecordStatus.PAID).count();
        long unpaidCount = records.stream().filter(r -> r.getStatus() == PartyDuesRecordStatus.UNPAID).count();
        BigDecimal rate = payableCount == 0
                ? ZERO
                : BigDecimal.valueOf(paidCount)
                        .divide(BigDecimal.valueOf(payableCount), 4, RoundingMode.HALF_UP);
        return new PartyDuesStatsView(yearMonth, money(totalDue), money(totalPaid), rate, unpaidCount);
    }

    @Transactional(readOnly = true)
    public List<PartyDuesRecordView> myRecords(UserPrincipal actor) {
        requireAuth(actor);
        Map<Long, User> users = userMap();
        Map<Long, Branch> branches = branchMap();
        return recordRepository.findByUserIdOrderByYearMonthDesc(actor.getId()).stream()
                .map(r -> toRecordView(r, users, branches))
                .toList();
    }

    private PartyDuesStandard buildStandard(
            UserPrincipal actor, PartyDuesStandard standard, PartyDuesStandardRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getRole() != Role.MEMBER) {
            throw new IllegalArgumentException("Party dues standards can only be assigned to members");
        }

        Long branchId = request.branchId() != null ? request.branchId() : user.getBranchId();
        if (branchId == null) {
            throw new IllegalArgumentException("branchId is required when the user has no branch");
        }
        if (!Objects.equals(branchId, user.getBranchId())) {
            throw new IllegalArgumentException("branchId must match the member branch");
        }
        assertBranchManageable(actor, branchId);

        BigDecimal rate = calculateRate(request.memberType(), request.monthlyIncome());
        BigDecimal amount = calculateAmount(request.memberType(), request.monthlyIncome(), rate);
        PartyDuesStandardStatus status = request.status() != null ? request.status() : PartyDuesStandardStatus.ACTIVE;
        if (status == PartyDuesStandardStatus.WAIVED || request.memberType() == PartyDuesMemberType.HARDSHIP) {
            rate = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
            amount = ZERO;
            status = PartyDuesStandardStatus.WAIVED;
        }

        standard.setUserId(request.userId());
        standard.setBranchId(branchId);
        standard.setMemberType(request.memberType());
        standard.setMonthlyIncome(money(request.monthlyIncome()));
        standard.setRate(rate);
        standard.setMonthlyAmount(amount);
        standard.setEffectiveDate(request.effectiveDate() != null ? request.effectiveDate() : LocalDate.now());
        standard.setStatus(status);
        standard.setNotes(request.notes());
        return standard;
    }

    private BigDecimal calculateRate(PartyDuesMemberType memberType, BigDecimal income) {
        BigDecimal value = income == null ? BigDecimal.ZERO : income;
        if (memberType == PartyDuesMemberType.STUDENT || memberType == PartyDuesMemberType.HARDSHIP) {
            return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        }
        if (memberType == PartyDuesMemberType.RETIRED) {
            return value.compareTo(BigDecimal.valueOf(5000)) < 0
                    ? new BigDecimal("0.0050")
                    : new BigDecimal("0.0100");
        }
        if (value.compareTo(BigDecimal.valueOf(3000)) < 0) {
            return new BigDecimal("0.0050");
        }
        if (value.compareTo(BigDecimal.valueOf(5000)) <= 0) {
            return new BigDecimal("0.0100");
        }
        if (value.compareTo(BigDecimal.valueOf(10000)) <= 0) {
            return new BigDecimal("0.0150");
        }
        return new BigDecimal("0.0200");
    }

    private BigDecimal calculateAmount(PartyDuesMemberType memberType, BigDecimal income, BigDecimal rate) {
        if (memberType == PartyDuesMemberType.STUDENT) {
            return new BigDecimal("0.20").setScale(2, RoundingMode.HALF_UP);
        }
        if (memberType == PartyDuesMemberType.HARDSHIP) {
            return ZERO;
        }
        return money(income.multiply(rate));
    }

    private Map<Long, PartyDuesStandard> latestStandards(LocalDate effectiveDate) {
        Map<Long, PartyDuesStandard> latest = new HashMap<>();
        for (PartyDuesStandard standard : standardRepository.findByEffectiveDateLessThanEqual(effectiveDate)) {
            PartyDuesStandard existing = latest.get(standard.getUserId());
            if (existing == null || standard.getEffectiveDate().isAfter(existing.getEffectiveDate())) {
                latest.put(standard.getUserId(), standard);
            }
        }
        return latest;
    }

    private void applyPayment(PartyDuesRecord record, BigDecimal paidAmount, String notes) {
        if (record.getStatus() == PartyDuesRecordStatus.WAIVED) {
            throw new IllegalArgumentException("Waived records cannot be marked paid");
        }
        record.setPaidAmount(money(paidAmount));
        record.setPaidAt(LocalDateTime.now());
        record.setStatus(PartyDuesRecordStatus.PAID);
        if (notes != null) {
            record.setNotes(notes);
        }
    }

    private void upsertReminder(PartyDuesRecord record) {
        PartyDuesReminder reminder = reminderRepository.findByUserIdAndYearMonth(record.getUserId(), record.getYearMonth())
                .orElseGet(PartyDuesReminder::new);
        reminder.setUserId(record.getUserId());
        reminder.setYearMonth(record.getYearMonth());
        reminder.setRemindedAt(LocalDateTime.now());
        reminder.setRemindCount(reminder.getRemindCount() == null ? 1 : reminder.getRemindCount() + 1);
        reminderRepository.save(reminder);
    }

    private PartyDuesRecord getManageableRecord(UserPrincipal actor, Long id) {
        PartyDuesRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Party dues record not found"));
        assertBranchManageable(actor, record.getBranchId());
        return record;
    }

    private void assertCanManage(UserPrincipal actor) {
        requireAuth(actor);
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.SECRETARY) {
            throw new AccessDeniedException("Only admins and secretaries can manage party dues");
        }
    }

    private void assertBranchManageable(UserPrincipal actor, Long branchId) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }
        if (actor.getRole() == Role.SECRETARY && Objects.equals(actor.getBranchId(), branchId)) {
            return;
        }
        throw new AccessDeniedException("Secretary can only manage own branch");
    }

    private Long requireActorBranch(UserPrincipal actor) {
        if (actor.getBranchId() == null) {
            throw new AccessDeniedException("Secretary is not bound to a branch");
        }
        return actor.getBranchId();
    }

    private void requireAuth(UserPrincipal actor) {
        if (actor == null) {
            throw new AccessDeniedException("Unauthorized");
        }
    }

    private YearMonth parseYearMonth(String yearMonth) {
        try {
            return YearMonth.parse(yearMonth, YEAR_MONTH_FORMAT);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("yearMonth must use yyyy-MM format");
        }
    }

    private BigDecimal money(BigDecimal value) {
        if (value == null) {
            return ZERO;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private Map<Long, User> userMap() {
        return userRepository.findAll().stream().collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private Map<Long, Branch> branchMap() {
        return branchRepository.findAll().stream().collect(Collectors.toMap(Branch::getId, Function.identity()));
    }

    private PartyDuesStandardView toStandardView(
            PartyDuesStandard standard, Map<Long, User> users, Map<Long, Branch> branches) {
        User user = users.get(standard.getUserId());
        Branch branch = branches.get(standard.getBranchId());
        return new PartyDuesStandardView(
                standard.getId(),
                standard.getUserId(),
                user != null ? user.getName() : "Unknown",
                standard.getBranchId(),
                branch != null ? branch.getName() : "Unknown",
                standard.getMemberType(),
                standard.getMonthlyIncome(),
                standard.getRate(),
                standard.getMonthlyAmount(),
                standard.getEffectiveDate(),
                standard.getStatus(),
                standard.getNotes());
    }

    private PartyDuesRecordView toRecordView(
            PartyDuesRecord record, Map<Long, User> users, Map<Long, Branch> branches) {
        User user = users.get(record.getUserId());
        Branch branch = branches.get(record.getBranchId());
        return new PartyDuesRecordView(
                record.getId(),
                record.getUserId(),
                user != null ? user.getName() : "Unknown",
                record.getBranchId(),
                branch != null ? branch.getName() : "Unknown",
                record.getYearMonth(),
                record.getDueAmount(),
                record.getPaidAmount(),
                record.getStatus(),
                record.getPaidAt(),
                record.getNotes());
    }
}
