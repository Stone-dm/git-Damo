package com.damo.partyschool.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.damo.partyschool.branch.Branch;
import com.damo.partyschool.branch.BranchRepository;
import com.damo.partyschool.exam.Exam;
import com.damo.partyschool.exam.ExamRepository;
import com.damo.partyschool.exam.ExamStatus;
import com.damo.partyschool.learning.LearningContent;
import com.damo.partyschool.learning.LearningRepository;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final LearningRepository learningRepository;
    private final ExamRepository examRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            BranchRepository branchRepository,
            LearningRepository learningRepository,
            ExamRepository examRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.learningRepository = learningRepository;
        this.examRepository = examRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            log.info("Seed skipped: users already present");
            return;
        }

        Branch branch = new Branch();
        branch.setName("示范党支部");
        branch.setDescription("演示用支部");
        branch = branchRepository.save(branch);

        userRepository.save(user("admin", "admin123", "系统管理员", Role.ADMIN, null));
        userRepository.save(user("secretary", "sec123", "支部书记", Role.SECRETARY, branch.getId()));
        userRepository.save(user("member", "mem123", "普通党员", Role.MEMBER, branch.getId()));

        learningRepository.save(learning("党章学习导读", "党章总纲与党员义务概要", null));
        learningRepository.save(learning("支部工作条例要点", "党支部工作条例精读摘要", branch.getId()));
        learningRepository.save(learning("廉洁自律准则", "党员廉洁自律基本规范", branch.getId()));

        Exam exam = new Exam();
        exam.setTitle("党纪基础知识测验");
        exam.setStatus(ExamStatus.OPEN);
        exam.setBranchId(branch.getId());
        examRepository.save(exam);

        log.info(
                "Seeded demo branch id={}, users, {} learning items, 1 exam",
                branch.getId(),
                learningRepository.count());
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
}
