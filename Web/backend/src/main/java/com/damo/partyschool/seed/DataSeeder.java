package com.damo.partyschool.seed;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.damo.partyschool.branch.Branch;
import com.damo.partyschool.branch.BranchRepository;
import com.damo.partyschool.development.DevelopmentRecord;
import com.damo.partyschool.development.DevelopmentRecordRepository;
import com.damo.partyschool.development.DevelopmentStage;
import com.damo.partyschool.learning.LearningContent;
import com.damo.partyschool.learning.LearningRepository;
import com.damo.partyschool.member.DocType;
import com.damo.partyschool.member.MemberDocument;
import com.damo.partyschool.member.MemberDocumentRepository;
import com.damo.partyschool.member.MemberProfile;
import com.damo.partyschool.member.MemberProfileRepository;
import com.damo.partyschool.member.MemberStatus;
import com.damo.partyschool.task.Task;
import com.damo.partyschool.task.TaskRepository;
import com.damo.partyschool.task.TaskStatus;
import com.damo.partyschool.task.TaskType;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import com.damo.partyschool.volunteer.ActivityStatus;
import com.damo.partyschool.volunteer.SignupStatus;
import com.damo.partyschool.volunteer.VolunteerActivity;
import com.damo.partyschool.volunteer.VolunteerActivityRepository;
import com.damo.partyschool.volunteer.VolunteerSignup;
import com.damo.partyschool.volunteer.VolunteerSignupRepository;

/**
 * 空库时写入测试数据，便于开发调试。
 *
 * 规则：
 * - 正式党员/流动党员（流动党员属于正式党员行列）→ 有 User 登录账号
 * - 预备党员 → 仅存档案，无 User 账号，通过 profile.name 显示姓名
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final MemberDocumentRepository memberDocumentRepository;
    private final DevelopmentRecordRepository developmentRecordRepository;
    private final LearningRepository learningRepository;
    private final TaskRepository taskRepository;
    private final VolunteerActivityRepository volunteerActivityRepository;
    private final VolunteerSignupRepository volunteerSignupRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            BranchRepository branchRepository,
            MemberProfileRepository memberProfileRepository,
            MemberDocumentRepository memberDocumentRepository,
            DevelopmentRecordRepository developmentRecordRepository,
            LearningRepository learningRepository,
            TaskRepository taskRepository,
            VolunteerActivityRepository volunteerActivityRepository,
            VolunteerSignupRepository volunteerSignupRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.memberDocumentRepository = memberDocumentRepository;
        this.developmentRecordRepository = developmentRecordRepository;
        this.learningRepository = learningRepository;
        this.taskRepository = taskRepository;
        this.volunteerActivityRepository = volunteerActivityRepository;
        this.volunteerSignupRepository = volunteerSignupRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean usersSeeded = userRepository.count() == 0;

        if (usersSeeded) {
            // ======================== 支部 ========================
        Branch branch1 = createBranch("第一党支部", "测试主支部");
        Branch branch2 = createBranch("第二党支部", "用于验证跨支部权限隔离");

        // ======================== 用户 ========================

        // —— 管理员 ——
        User admin = createUser("admin", "admin123", "系统管理员", Role.ADMIN, null);

        // —— 第一党支部 ——
        User sec1 = createUser("secretary", "sec123", "张书记", Role.SECRETARY, branch1.getId());
        User m1 = createUser("zhangsan", "mem123", "张三", Role.MEMBER, branch1.getId());
        User m3 = createUser("wangwu", "mem123", "王五", Role.MEMBER, branch1.getId());

        // —— 第二党支部 ——
        User sec2 = createUser("secretary2", "sec123", "李书记", Role.SECRETARY, branch2.getId());
        User m4 = createUser("zhaoliu", "mem123", "赵六", Role.MEMBER, branch2.getId());

        // ======================== 党员档案 ========================

        // 张书记（正式党员）
        createProfile(sec1.getId(), branch1.getId(), null,
                "MALE", "汉族", LocalDate.of(1982, 5, 10),
                "13800000101", "硕士", "法学硕士", "市委组织部", "支部书记",
                LocalDate.of(2005, 7, 1), LocalDate.of(2006, 7, 1), MemberStatus.FORMAL);

        // 张三（正式党员）
        createProfile(m1.getId(), branch1.getId(), null,
                "MALE", "汉族", LocalDate.of(1990, 3, 15),
                "13800000102", "本科", "工学学士", "市工信局", "科长",
                LocalDate.of(2015, 6, 1), LocalDate.of(2016, 6, 1), MemberStatus.FORMAL);

        // 李四（预备党员 - 无账号，纯档案，用 profile.name 显示姓名）
        createProfile(null, branch1.getId(), "李四",
                "FEMALE", "回族", LocalDate.of(1996, 11, 8),
                "13800000103", "硕士", "文学硕士", "市委宣传部", "干事",
                LocalDate.of(2024, 9, 1), null, MemberStatus.PROBATIONARY);

        // 王五（流动党员 - 有账号，流动党员属于正式党员行列）
        createProfile(m3.getId(), branch1.getId(), null,
                "MALE", "汉族", LocalDate.of(1988, 7, 22),
                "13800000104", "本科", "管理学学士", "外派协作单位", "项目主管",
                LocalDate.of(2012, 4, 1), LocalDate.of(2013, 4, 1),
                MemberStatus.FLOATING,
                "广州市天河区", LocalDate.of(2025, 1, 1),
                "长期驻外项目需要", LocalDate.of(2026, 12, 31), "13800000104");

        // 李书记（正式党员）
        createProfile(sec2.getId(), branch2.getId(), null,
                "MALE", "汉族", LocalDate.of(1979, 12, 5),
                "13800000200", "博士", "管理学博士", "市财政局党委", "支部书记",
                LocalDate.of(2002, 9, 1), LocalDate.of(2003, 9, 1), MemberStatus.FORMAL);

        // 赵六（正式党员）
        createProfile(m4.getId(), branch2.getId(), null,
                "FEMALE", "汉族", LocalDate.of(1993, 1, 30),
                "13800000201", "本科", "经济学学士", "市财政局", "副主任",
                LocalDate.of(2018, 10, 1), LocalDate.of(2019, 10, 1), MemberStatus.FORMAL);

        // ======================== 档案材料（仅正式党员） ========================
        Long uploaderId = admin.getId();

        createDoc(m1.getId(), DocType.APPLICATION, "张三 - 入党申请书", "zhangsan_application.pdf", uploaderId);
        createDoc(m1.getId(), DocType.VOLUNTEER_FORM, "张三 - 入党志愿书", "zhangsan_volunteer.pdf", uploaderId);
        createDoc(m1.getId(), DocType.CONVERSION_APPLICATION, "张三 - 转正申请书", "zhangsan_conversion.pdf", uploaderId);

        // ======================== 发展记录 ========================
        createDevRecord(m1.getId(), DevelopmentStage.FORMAL,
                LocalDate.of(2015, 6, 1), LocalDate.of(2016, 6, 1), "已按期转正");

        // ======================== 学习内容 ========================
        LearningContent lc1 = createLearning("党章学习导读", "学习党章总纲与党员义务，理解党的基本路线", null);
        LearningContent lc2 = createLearning("支部工作条例要点", "《中国共产党支部工作条例（试行）》精读", branch1.getId());
        createLearning("廉洁自律准则学习", "党员廉洁自律基本规范与典型案例", branch1.getId());
        createLearning("第二支部专题学习", "仅第二党支部可见的学习材料", branch2.getId());

        // ======================== 任务 ========================
        createTask("党章精读任务", "全体党员完成党章学习",
                TaskType.LEARNING, TaskStatus.ACTIVE, "ALL", null,
                lc1.getId(), LocalDateTime.now().plusDays(14));
        createTask("支部工作条例学习", "第一党支部成员学习支部工作条例",
                TaskType.LEARNING, TaskStatus.ACTIVE, "BRANCH", String.valueOf(branch1.getId()),
                lc2.getId(), LocalDateTime.now().plusDays(21));
        createTask("第二支部专项任务", "第二党支部专属任务（验证权限隔离）",
                TaskType.LEARNING, TaskStatus.DRAFT, "BRANCH", String.valueOf(branch2.getId()),
                null, LocalDateTime.now().plusDays(7));

        log.info("Seed complete: {} users, {} branches, {} profiles, {} docs, {} dev-records, {} learnings, {} tasks",
                userRepository.count(), branchRepository.count(), memberProfileRepository.count(),
                memberDocumentRepository.count(), developmentRecordRepository.count(),
                learningRepository.count(), taskRepository.count());
        log.info("Test logins (正式/流动党员可登录):");
        log.info("  admin/admin123 (管理员)");
        log.info("  secretary/sec123 (张书记)  zhangsan/mem123 (张三)  wangwu/mem123 (王五·流动)");
        log.info("  secretary2/sec123 (李书记)  zhaoliu/mem123 (赵六)");
        log.info("  李四(预备) 仅存档案，无登录账号");
        } // end if (usersSeeded)

        // seed volunteer data (runs even on existing DB if no activities yet)
        seedVolunteerData();
    }

    // ======================== 工厂方法 ========================

    private Branch createBranch(String name, String description) {
        Branch b = new Branch();
        b.setName(name);
        b.setDescription(description);
        return branchRepository.save(b);
    }

    private User createUser(String username, String rawPassword, String name, Role role, Long branchId) {
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setName(name);
        u.setRole(role);
        u.setBranchId(branchId);
        return userRepository.save(u);
    }

    private MemberProfile createProfile(
            Long userId, Long branchId, String name,
            String gender, String ethnicity, LocalDate birthDate,
            String phone, String education, String degree, String workplace, String position,
            LocalDate joinDate, LocalDate formalDate, MemberStatus status) {
        return createProfile(userId, branchId, name, gender, ethnicity, birthDate,
                phone, education, degree, workplace, position,
                joinDate, formalDate, status,
                null, null, null, null, null);
    }

    private MemberProfile createProfile(
            Long userId, Long branchId, String name,
            String gender, String ethnicity, LocalDate birthDate,
            String phone, String education, String degree, String workplace, String position,
            LocalDate joinDate, LocalDate formalDate, MemberStatus status,
            String floatingLocation, LocalDate floatingStartDate, String floatingReason,
            LocalDate floatingExpectedReturn, String floatingContact) {
        MemberProfile p = new MemberProfile();
        p.setUserId(userId);
        p.setBranchId(branchId);
        p.setName(name);
        p.setGender(gender);
        p.setEthnicity(ethnicity);
        p.setBirthDate(birthDate);
        p.setPhone(phone);
        p.setEducation(education);
        p.setDegree(degree);
        p.setWorkplace(workplace);
        p.setPosition(position);
        p.setJoinDate(joinDate);
        p.setFormalDate(formalDate);
        p.setMemberStatus(status);
        p.setFloatingLocation(floatingLocation);
        p.setFloatingStartDate(floatingStartDate);
        p.setFloatingReason(floatingReason);
        p.setFloatingExpectedReturn(floatingExpectedReturn);
        p.setFloatingContact(floatingContact);
        return memberProfileRepository.save(p);
    }

    private MemberDocument createDoc(Long userId, DocType docType, String title, String fileName, Long uploaderId) {
        MemberDocument d = new MemberDocument();
        d.setUserId(userId);
        d.setDocType(docType);
        d.setTitle(title);
        d.setFileUrl("member-documents/" + userId + "/" + docType.name() + "/seed_" + fileName);
        d.setFileName(fileName);
        d.setUploadedAt(LocalDateTime.now().minusDays(30));
        d.setUploaderId(uploaderId);
        return memberDocumentRepository.save(d);
    }

    private DevelopmentRecord createDevRecord(Long userId, DevelopmentStage stage,
            LocalDate start, LocalDate end, String notes) {
        DevelopmentRecord r = new DevelopmentRecord();
        r.setUserId(userId);
        r.setStage(stage);
        r.setStartDate(start);
        r.setEndDate(end);
        r.setNotes(notes);
        return developmentRecordRepository.save(r);
    }

    private LearningContent createLearning(String title, String summary, Long branchId) {
        LearningContent lc = new LearningContent();
        lc.setTitle(title);
        lc.setSummary(summary);
        lc.setBranchId(branchId);
        return learningRepository.save(lc);
    }

    private Task createTask(String title, String description, TaskType type, TaskStatus status,
            String targetType, String targetBranchIds, Long referenceId, LocalDateTime dueDate) {
        Task t = new Task();
        t.setTitle(title);
        t.setDescription(description);
        t.setType(type);
        t.setStatus(status);
        t.setTargetType(targetType);
        t.setTargetBranchIds(targetBranchIds);
        t.setReferenceId(referenceId);
        t.setDueDate(dueDate);
        return taskRepository.save(t);
    }

    // ======================== 志愿服务种子数据 ========================

    private void seedVolunteerData() {
        if (volunteerActivityRepository.count() > 0) {
            log.info("Volunteer seed skipped: activities already present");
            return;
        }

        List<User> users = userRepository.findAll();
        User admin = users.stream().filter(u -> "admin".equals(u.getUsername())).findFirst().orElse(null);
        User zhangsan = users.stream().filter(u -> "zhangsan".equals(u.getUsername())).findFirst().orElse(null);
        User wangwu = users.stream().filter(u -> "wangwu".equals(u.getUsername())).findFirst().orElse(null);
        User zhaoliu = users.stream().filter(u -> "zhaoliu".equals(u.getUsername())).findFirst().orElse(null);

        if (admin == null) {
            log.warn("Volunteer seed skipped: no admin user found");
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        // --- 活动1: 社区环境清洁志愿活动（已结束，4人参与+1人缺席=5条报名记录） ---
        VolunteerActivity a1 = new VolunteerActivity();
        a1.setTitle("社区环境清洁志愿活动");
        a1.setDescription("组织党员走进社区，开展环境卫生清洁、垃圾分类宣传等志愿服务，以实际行动美化社区环境，增强党员服务意识。");
        a1.setLocation("阳光社区广场及周边街道");
        a1.setStartTime(now.minusMonths(2).withDayOfMonth(10).withHour(9).withMinute(0));
        a1.setEndTime(now.minusMonths(2).withDayOfMonth(10).withHour(17).withMinute(0));
        a1.setMaxParticipants(10);
        a1.setOrganizerId(admin.getId());
        a1.setStatus(ActivityStatus.FINISHED);
        a1 = volunteerActivityRepository.save(a1);

        createSignup(a1.getId(), admin.getId(), SignupStatus.PARTICIPATED, 8.0, a1.getStartTime(), "负责协调统筹");
        createSignup(a1.getId(), zhangsan.getId(), SignupStatus.PARTICIPATED, 8.0, a1.getStartTime(), "清扫主干道");
        createSignup(a1.getId(), wangwu.getId(), SignupStatus.PARTICIPATED, 7.5, a1.getStartTime(), "垃圾分类宣传");
        createSignup(a1.getId(), zhaoliu.getId(), SignupStatus.PARTICIPATED, 8.0, a1.getStartTime(), "清理绿化带");
        // 第5条：报名但缺席 — 复用admin ID被唯一约束限制，这里用一个不存在的用户ID模拟
        createSignup(a1.getId(), 9999L, SignupStatus.ABSENT, null, a1.getStartTime(), "临时有事未能参加");

        log.info("  Activity 1: 社区环境清洁志愿活动 (FINISHED, 5 signups)");

        // --- 活动2: 老党员走访慰问（进行中，3人报名） ---
        VolunteerActivity a2 = new VolunteerActivity();
        a2.setTitle("老党员走访慰问");
        a2.setDescription("组织党员志愿者走访慰问社区高龄老党员，送去组织的关怀和温暖，了解他们的生活需求和困难，记录他们的意见和建议。");
        a2.setLocation("各社区老党员家中");
        a2.setStartTime(now.minusWeeks(2).withHour(9).withMinute(0));
        a2.setEndTime(now.plusWeeks(2).withHour(17).withMinute(0));
        a2.setMaxParticipants(6);
        a2.setOrganizerId(admin.getId());
        a2.setStatus(ActivityStatus.ONGOING);
        a2 = volunteerActivityRepository.save(a2);

        createSignup(a2.getId(), zhangsan.getId(), SignupStatus.SIGNED_UP, null, null, "可提供车辆");
        createSignup(a2.getId(), wangwu.getId(), SignupStatus.SIGNED_UP, null, null, null);
        createSignup(a2.getId(), zhaoliu.getId(), SignupStatus.SIGNED_UP, null, null, "有社区工作经验");

        log.info("  Activity 2: 老党员走访慰问 (ONGOING, 3 signed up)");

        // --- 活动3: 党建知识宣传进社区（已发布，2人报名） ---
        VolunteerActivity a3 = new VolunteerActivity();
        a3.setTitle("党建知识宣传进社区");
        a3.setDescription("在社区设立宣传点，向居民发放党建知识手册，讲解党的历史和方针政策，开展有奖问答活动，增强社区居民对党的认同感。");
        a3.setLocation("幸福社区文化活动中心");
        a3.setStartTime(now.plusWeeks(1).withHour(9).withMinute(0));
        a3.setEndTime(now.plusWeeks(1).withHour(16).withMinute(0));
        a3.setMaxParticipants(15);
        a3.setOrganizerId(admin.getId());
        a3.setStatus(ActivityStatus.PUBLISHED);
        a3 = volunteerActivityRepository.save(a3);

        createSignup(a3.getId(), zhangsan.getId(), SignupStatus.SIGNED_UP, null, null, "擅长讲解");
        createSignup(a3.getId(), wangwu.getId(), SignupStatus.SIGNED_UP, null, null, null);

        log.info("  Activity 3: 党建知识宣传进社区 (PUBLISHED, 2 signed up)");

        // --- 额外：再创建几个历史活动来丰富12月趋势数据 ---
        for (int i = 1; i <= 3; i++) {
            VolunteerActivity hist = new VolunteerActivity();
            hist.setTitle("第" + i + "季度党员志愿服务日");
            hist.setDescription("季度常规志愿服务活动");
            hist.setLocation("社区服务中心");
            hist.setStartTime(now.minusMonths(i * 3 + 1).withDayOfMonth(15).withHour(9).withMinute(0));
            hist.setEndTime(now.minusMonths(i * 3 + 1).withDayOfMonth(15).withHour(17).withMinute(0));
            hist.setMaxParticipants(8);
            hist.setOrganizerId(admin.getId());
            hist.setStatus(ActivityStatus.FINISHED);
            hist = volunteerActivityRepository.save(hist);

            createSignup(hist.getId(), admin.getId(), SignupStatus.PARTICIPATED, 8.0, hist.getStartTime(), null);
            createSignup(hist.getId(), zhangsan.getId(), SignupStatus.PARTICIPATED, 8.0, hist.getStartTime(), null);
            createSignup(hist.getId(), wangwu.getId(), SignupStatus.PARTICIPATED, 7.0, hist.getStartTime(), null);
        }

        log.info("Volunteer seed complete: {} activities, {} signups",
                volunteerActivityRepository.count(), volunteerSignupRepository.count());
    }

    private VolunteerSignup createSignup(Long activityId, Long userId, SignupStatus status,
            Double serviceHours, LocalDateTime startTime, String notes) {
        VolunteerSignup s = new VolunteerSignup();
        s.setActivityId(activityId);
        s.setUserId(userId);
        s.setStatus(status);
        s.setServiceHours(serviceHours);
        s.setNotes(notes);
        // signedUpAt: use activity start time or now
        s.setSignedUpAt(startTime != null ? startTime.minusDays(3) : LocalDateTime.now().minusDays(1));
        if (status == SignupStatus.PARTICIPATED && startTime != null) {
            s.setParticipatedAt(startTime.plusHours(8));
        }
        return volunteerSignupRepository.save(s);
    }
}
