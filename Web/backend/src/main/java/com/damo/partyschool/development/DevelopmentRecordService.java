package com.damo.partyschool.development;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import com.damo.partyschool.user.UserService;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DevelopmentRecordService {

    private final DevelopmentRecordRepository repository;
    private final UserRepository userRepository;
    private final UserService userService;

    public DevelopmentRecordService(
            DevelopmentRecordRepository repository,
            UserRepository userRepository,
            UserService userService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional
    public DevelopmentRecordView create(UserPrincipal actor, DevelopmentRecordRequest request) {
        userService.requireAccessibleUser(actor, request.userId());
        DevelopmentRecord record = new DevelopmentRecord();
        record.setUserId(request.userId());
        record.setStage(request.stage());
        record.setStartDate(request.startDate());
        record.setEndDate(request.endDate());
        record.setNotes(request.notes());
        record = repository.save(record);

        User user = userRepository.findById(request.userId()).orElse(null);
        return DevelopmentRecordView.from(record, user != null ? user.getName() : "—");
    }

    @Transactional(readOnly = true)
    public List<DevelopmentRecordView> listByUser(UserPrincipal actor, Long userId) {
        userService.requireAccessibleUser(actor, userId);
        return repository.findByUserIdOrderByStartDateAsc(userId).stream()
                .map(r -> {
                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    return DevelopmentRecordView.from(r, user != null ? user.getName() : "—");
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DevelopmentRecordView> listByStage(UserPrincipal actor, DevelopmentStage stage) {
        return filterForActor(actor, repository.findByStage(stage));
    }

    @Transactional(readOnly = true)
    public List<DevelopmentRecordView> listAll(UserPrincipal actor) {
        return filterForActor(actor, repository.findAll());
    }

    private List<DevelopmentRecordView> filterForActor(UserPrincipal actor, List<DevelopmentRecord> records) {
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Stream<DevelopmentRecord> stream = records.stream()
                .filter(r -> userMap.containsKey(r.getUserId()));
        if (actor.getRole() == Role.SECRETARY) {
            Long bid = actor.getBranchId();
            if (bid == null) {
                return List.of();
            }
            stream = stream.filter(r -> {
                User u = userMap.get(r.getUserId());
                return u.getRole() == Role.MEMBER && Objects.equals(u.getBranchId(), bid);
            });
        }
        return stream
                .map(r -> DevelopmentRecordView.from(r, userMap.get(r.getUserId()).getName()))
                .toList();
    }
}
