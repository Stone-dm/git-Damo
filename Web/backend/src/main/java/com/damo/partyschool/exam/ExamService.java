package com.damo.partyschool.exam;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.user.Role;

@Service
public class ExamService {

    private final ExamRepository examRepository;

    public ExamService(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    @Transactional(readOnly = true)
    public List<ExamView> list(UserPrincipal actor) {
        List<Exam> exams;
        if (actor.getRole() == Role.ADMIN) {
            exams = examRepository.findAll();
        } else if (actor.getBranchId() == null) {
            exams = List.of();
        } else {
            exams = examRepository.findByBranchId(actor.getBranchId());
        }
        return exams.stream().map(ExamView::from).toList();
    }
}
