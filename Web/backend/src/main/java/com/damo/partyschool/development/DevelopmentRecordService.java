package com.damo.partyschool.development;

import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DevelopmentRecordService {

    private final DevelopmentRecordRepository repository;
    private final UserRepository userRepository;

    public DevelopmentRecordService(
            DevelopmentRecordRepository repository,
            UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional
    public DevelopmentRecordView create(DevelopmentRecordRequest request) {
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
    public List<DevelopmentRecordView> listByUser(Long userId) {
        return repository.findByUserIdOrderByStartDateAsc(userId).stream()
                .map(r -> {
                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    return DevelopmentRecordView.from(r, user != null ? user.getName() : "—");
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DevelopmentRecordView> listByStage(DevelopmentStage stage) {
        List<DevelopmentRecord> records = repository.findByStage(stage);
        Map<Long, String> userNameMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        return records.stream()
                .map(r -> DevelopmentRecordView.from(
                        r, userNameMap.getOrDefault(r.getUserId(), "—")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DevelopmentRecordView> listAll() {
        List<DevelopmentRecord> records = repository.findAll();
        Map<Long, String> userNameMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        return records.stream()
                .map(r -> DevelopmentRecordView.from(
                        r, userNameMap.getOrDefault(r.getUserId(), "—")))
                .toList();
    }
}
