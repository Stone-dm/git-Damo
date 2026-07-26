package com.damo.partyschool.seed;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
import com.damo.partyschool.exam.Exam;
import com.damo.partyschool.exam.ExamRepository;
import com.damo.partyschool.exam.ExamStatus;
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
import com.damo.partyschool.training.TrainingPlan;
import com.damo.partyschool.training.TrainingPlanRepository;
import com.damo.partyschool.training.TrainingRecord;
import com.damo.partyschool.training.TrainingRecordRepository;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;

/**
 * 空库时写入多支部演示数据，便于验证「书记仅本支部」：
 * 示范党支部（secretary）vs 第二党支部（secretary2）。
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final LearningRepository learningRepository;
    private final ExamRepository examRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final DevelopmentRecordRepository developmentRecordRepository;
    private final TrainingPlanRepository trainingPlanRepository;
    private final TrainingRecordRepository trainingRecordRepository;
    private final TaskRepository taskRepository;
    private final MemberDocumentRepository memberDocumentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            BranchRepository branchRepository,
            LearningRepository learningRepository,
            ExamRepository examRepository,
            MemberProfileRepository memberProfileRepository,
            DevelopmentRecordRepository developmentRecordRepository,
            TrainingPlanRepository trainingPlanRepository,
            TrainingRecordRepository trainingRecordRepository,
            TaskRepository taskRepository,
            MemberDocumentRepository memberDocumentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.learningRepository = learningRepository;
        this.examRepository = examRepository;
        this.memberProfileRepository = memberProfileRepository;
        this.developmentRecordRepository = developmentRecordRepository;
        this.trainingPlanRepository = trainingPlanRepository;
        this.trainingRecordRepository = trainingRecordRepository;
        this.taskRepository = taskRepository;
        this.memberDocumentRepository = memberDocumentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            log.info("Seed skipped: users already present");
            return;
        }

        Branch demo = branch("示范党支部", "演示用本支部（secretary 所属）");
        Branch other = branch("第二党支部", "对照支部（用于验证书记不可跨支部）");

        userRepository.save(user("admin", "admin123", "系统管理员", Role.ADMIN, null));

        // —— 示范党支部 ——
        userRepository.save(user("secretary", "sec123", "示范支部书记", Role.SECRETARY, demo.getId()));
        User member = userRepository.save(
                user("member", "mem123", "普通党员", Role.MEMBER, demo.getId()));
        User zhang = userRepository.save(
                user("zhangwei", "mem123", "张伟", Role.MEMBER, demo.getId()));
        User li = userRepository.save(
                user("lina", "mem123", "李娜", Role.MEMBER, demo.getId()));
        User wang = userRepository.save(
                user("wangfang", "mem123", "王芳", Role.MEMBER, demo.getId()));

        // —— 第二党支部 ——
        userRepository.save(user("secretary2", "sec123", "第二支部书记", Role.SECRETARY, other.getId()));
        User zhao = userRepository.save(
                user("zhaoqiang", "mem123", "赵强", Role.MEMBER, other.getId()));
        User chen = userRepository.save(
                user("chenxi", "mem123", "陈曦", Role.MEMBER, other.getId()));

        // 档案
        memberProfileRepository.save(profile(
                member.getId(), "MALE", "汉族", LocalDate.of(1990, 5, 12),
                "13800001001", "本科", "工学学士", "示范单位党委", "干事",
                LocalDate.of(2015, 7, 1), LocalDate.of(2016, 7, 1),
                MemberStatus.FORMAL, null, null, null, null, null));
        memberProfileRepository.save(profile(
                zhang.getId(), "MALE", "汉族", LocalDate.of(1988, 3, 8),
                "13800001002", "硕士", "法学硕士", "示范单位办公室", "科员",
                LocalDate.of(2018, 1, 15), LocalDate.of(2019, 1, 15),
                MemberStatus.FORMAL, null, null, null, null, null));
        memberProfileRepository.save(profile(
                li.getId(), "FEMALE", "回族", LocalDate.of(1995, 11, 20),
                "13800001003", "本科", "文学学士", "示范单位宣传部", "干事",
                LocalDate.of(2024, 6, 1), null,
                MemberStatus.PROBATIONARY, null, null, null, null, null));
        memberProfileRepository.save(profile(
                wang.getId(), "FEMALE", "汉族", LocalDate.of(1992, 9, 3),
                "13800001004", "本科", null, "驻外协作单位", "专员",
                LocalDate.of(2017, 5, 1), LocalDate.of(2018, 5, 1),
                MemberStatus.FLOATING, "上海市浦东新区",
                LocalDate.of(2025, 3, 1), "因工作需要长期驻外",
                LocalDate.of(2027, 3, 1), "13800001004"));
        memberProfileRepository.save(profile(
                zhao.getId(), "MALE", "汉族", LocalDate.of(1985, 2, 14),
                "13900002001", "本科", null, "第二单位", "主任",
                LocalDate.of(2010, 3, 1), LocalDate.of(2011, 3, 1),
                MemberStatus.FORMAL, null, null, null, null, null));
        memberProfileRepository.save(profile(
                chen.getId(), "FEMALE", "汉族", LocalDate.of(1998, 7, 22),
                "13900002002", "硕士", null, "第二单位", "助理",
                LocalDate.of(2023, 12, 1), null,
                MemberStatus.PROBATIONARY, null, null, null, null, null));

        // ===== 档案材料种子数据 =====
        Long uploaderId = userRepository.findByUsername("admin").orElseThrow().getId();

        // 正式党员 张伟：入党申请书 + 入党志愿书 + 转正申请书（完整3类）
        memberDocumentRepository.save(memberDoc(zhang.getId(), DocType.APPLICATION,
                "张伟 - 入党申请书", "zhangwei_application.pdf", uploaderId));
        memberDocumentRepository.save(memberDoc(zhang.getId(), DocType.VOLUNTEER_FORM,
                "张伟 - 入党志愿书", "zhangwei_volunteer.pdf", uploaderId));
        memberDocumentRepository.save(memberDoc(zhang.getId(), DocType.CONVERSION_APPLICATION,
                "张伟 - 转正申请书", "zhangwei_conversion.pdf", uploaderId));

        // 正式党员 普通党员(member)：入党申请书 + 入党志愿书 + 转正申请书
        memberDocumentRepository.save(memberDoc(member.getId(), DocType.APPLICATION,
                "普通党员 - 入党申请书", "member_application.pdf", uploaderId));
        memberDocumentRepository.save(memberDoc(member.getId(), DocType.VOLUNTEER_FORM,
                "普通党员 - 入党志愿书", "member_volunteer.pdf", uploaderId));
        memberDocumentRepository.save(memberDoc(member.getId(), DocType.CONVERSION_APPLICATION,
                "普通党员 - 转正申请书", "member_conversion.pdf", uploaderId));

        // 预备党员 李娜：入党申请书 + 思想汇报 + 入党志愿书（缺转正申请书）
        memberDocumentRepository.save(memberDoc(li.getId(), DocType.APPLICATION,
                "李娜 - 入党申请书", "lina_application.pdf", uploaderId));
        memberDocumentRepository.save(memberDoc(li.getId(), DocType.THOUGHT_REPORT,
                "2024年第一季度思想汇报", "lina_thought_q1.pdf", uploaderId));
        memberDocumentRepository.save(memberDoc(li.getId(), DocType.VOLUNTEER_FORM,
                "李娜 - 入党志愿书", "lina_volunteer.pdf", uploaderId));

        // 流动党员 王芳：入党申请书 + 思想汇报
        memberDocumentRepository.save(memberDoc(wang.getId(), DocType.APPLICATION,
                "王芳 - 入党申请书", "wangfang_application.pdf", uploaderId));
        memberDocumentRepository.save(memberDoc(wang.getId(), DocType.THOUGHT_REPORT,
                "王芳 - 思想汇报", "wangfang_thought.pdf", uploaderId));

        log.info("Seeded {} member documents", memberDocumentRepository.count());

        // 发展记录（本支部 + 外支部各一条）
        developmentRecordRepository.save(dev(
                li.getId(), DevelopmentStage.PROBATIONARY,
                LocalDate.of(2024, 6, 1), null, "示范支部预备党员考察中"));
        developmentRecordRepository.save(dev(
                zhang.getId(), DevelopmentStage.FORMAL,
                LocalDate.of(2018, 1, 15), LocalDate.of(2019, 1, 15), "已转正"));
        developmentRecordRepository.save(dev(
                chen.getId(), DevelopmentStage.ACTIVIST,
                LocalDate.of(2023, 6, 1), LocalDate.of(2023, 11, 30), "第二支部积极分子（书记不可见）"));

        // 学习内容
        learningRepository.save(learning("党章学习导读", "党章总纲与党员义务概要", null));
        LearningContent branchLearning = learningRepository.save(
                learning("支部工作条例要点", "党支部工作条例精读摘要", demo.getId()));
        learningRepository.save(learning("廉洁自律准则", "党员廉洁自律基本规范", demo.getId()));
        learningRepository.save(learning("第二支部专题学习", "仅第二支部可见的学习材料", other.getId()));

        // 考试
        Exam demoExam = examRepository.save(exam("党纪基础知识测验", ExamStatus.OPEN, demo.getId()));
        examRepository.save(exam("第二支部专项测验", ExamStatus.DRAFT, other.getId()));

        // 培训计划（全局）+ 完成记录（分支部）
        TrainingPlan theory = trainingPlanRepository.save(
                plan("党的创新理论专题", "集中学习习近平新时代中国特色社会主义思想", "THEORY"));
        TrainingPlan practice = trainingPlanRepository.save(
                plan("基层实践锻炼", "参与支部主题党日与志愿服务", "PRACTICE"));
        trainingRecordRepository.save(completed(theory.getId(), member.getId()));
        trainingRecordRepository.save(completed(theory.getId(), zhang.getId()));
        trainingRecordRepository.save(completed(practice.getId(), zhao.getId())); // 外支部完成记录

        // 任务：本支部草稿、全平台、外支部（用于对照权限）
        taskRepository.save(task(
                "本支部党章精读任务",
                "示范支部党员完成支部学习材料",
                TaskType.LEARNING,
                TaskStatus.DRAFT,
                "BRANCH",
                String.valueOf(demo.getId()),
                branchLearning.getId(),
                LocalDateTime.now().plusDays(14)));
        taskRepository.save(task(
                "全平台廉洁教育",
                "全体党员学习廉洁自律准则",
                TaskType.LEARNING,
                TaskStatus.ACTIVE,
                "ALL",
                null,
                null,
                LocalDateTime.now().plusDays(30)));
        taskRepository.save(task(
                "第二支部专项考试任务",
                "仅第二支部目标（示范书记不可派发）",
                TaskType.EXAM,
                TaskStatus.DRAFT,
                "BRANCH",
                String.valueOf(other.getId()),
                null,
                LocalDateTime.now().plusDays(7)));
        taskRepository.save(task(
                "本支部党纪测验",
                "示范支部开放考试",
                TaskType.EXAM,
                TaskStatus.ACTIVE,
                "BRANCH",
                String.valueOf(demo.getId()),
                demoExam.getId(),
                LocalDateTime.now().plusDays(21)));

        log.info(
                "Seeded branches demoId={} otherId={}, users={}, profiles={}, tasks={}, exams={}",
                demo.getId(),
                other.getId(),
                userRepository.count(),
                memberProfileRepository.count(),
                taskRepository.count(),
                examRepository.count());
        log.info(
                "Demo logins: admin/admin123 | secretary/sec123 (示范) | secretary2/sec123 (第二) | member*/mem123");
    }

    private Branch branch(String name, String description) {
        Branch branch = new Branch();
        branch.setName(name);
        branch.setDescription(description);
        return branchRepository.save(branch);
    }

    private User user(String username, String rawPassword, String name, Role role, Long branchId) {
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setName(name);
        user.setRole(role);
        user.setBranchId(branchId);
        return user;
    }

    private LearningContent learning(String title, String summary, Long branchId) {
        LearningContent content = new LearningContent();
        content.setTitle(title);
        content.setSummary(summary);
        content.setBranchId(branchId);
        return content;
    }

    private Exam exam(String title, ExamStatus status, Long branchId) {
        Exam exam = new Exam();
        exam.setTitle(title);
        exam.setStatus(status);
        exam.setBranchId(branchId);
        return exam;
    }

    private MemberProfile profile(
            Long userId,
            String gender,
            String ethnicity,
            LocalDate birthDate,
            String phone,
            String education,
            String degree,
            String workplace,
            String position,
            LocalDate joinDate,
            LocalDate formalDate,
            MemberStatus status,
            String floatingLocation,
            LocalDate floatingStartDate,
            String floatingReason,
            LocalDate floatingExpectedReturn,
            String floatingContact) {
        MemberProfile p = new MemberProfile();
        p.setUserId(userId);
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
        return p;
    }

    private DevelopmentRecord dev(
            Long userId, DevelopmentStage stage, LocalDate start, LocalDate end, String notes) {
        DevelopmentRecord r = new DevelopmentRecord();
        r.setUserId(userId);
        r.setStage(stage);
        r.setStartDate(start);
        r.setEndDate(end);
        r.setNotes(notes);
        return r;
    }

    private TrainingPlan plan(String title, String description, String planType) {
        TrainingPlan p = new TrainingPlan();
        p.setTitle(title);
        p.setDescription(description);
        p.setPlanType(planType);
        p.setStatus("ACTIVE");
        return p;
    }

    private TrainingRecord completed(Long planId, Long userId) {
        TrainingRecord r = new TrainingRecord();
        r.setPlanId(planId);
        r.setUserId(userId);
        r.setCompleted(true);
        r.setCompletedAt(LocalDateTime.now().minusDays(3));
        return r;
    }

    private Task task(
            String title,
            String description,
            TaskType type,
            TaskStatus status,
            String targetType,
            String targetBranchIds,
            Long referenceId,
            LocalDateTime dueDate) {
        Task t = new Task();
        t.setTitle(title);
        t.setDescription(description);
        t.setType(type);
        t.setStatus(status);
        t.setTargetType(targetType);
        t.setTargetBranchIds(targetBranchIds);
        t.setReferenceId(referenceId);
        t.setDueDate(dueDate);
        return t;
    }

    private MemberDocument memberDoc(
            Long userId, DocType docType, String title, String fileName, Long uploaderId) {
        MemberDocument doc = new MemberDocument();
        doc.setUserId(userId);
        doc.setDocType(docType);
        doc.setTitle(title);
        doc.setFileUrl("member-documents/" + userId + "/" + docType.name() + "/seed_" + fileName);
        doc.setFileName(fileName);
        doc.setUploadedAt(LocalDateTime.now().minusDays(30));
        doc.setUploaderId(uploaderId);
        return doc;
    }
}
