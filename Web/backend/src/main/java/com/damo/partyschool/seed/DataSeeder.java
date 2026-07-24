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
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            BranchRepository branchRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
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

        log.info("Seeded demo branch id={} and users admin/secretary/member", branch.getId());
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
}
