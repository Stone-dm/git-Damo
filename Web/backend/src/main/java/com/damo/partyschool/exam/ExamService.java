package com.damo.partyschool.exam;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
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

    @Transactional
    public ExamView createExam(UserPrincipal actor, ExamRequest request) {
        Exam exam = new Exam();
        exam.setTitle(request.title().trim());
        exam.setStatus(request.status() != null ? request.status() : ExamStatus.DRAFT);
        Long branchId;
        if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() == null) {
                throw new AccessDeniedException("书记未绑定支部");
            }
            branchId = actor.getBranchId();
        } else {
            branchId = request.branchId() != null ? request.branchId() : actor.getBranchId();
        }
        exam.setBranchId(branchId);
        exam = examRepository.save(exam);
        return ExamView.from(exam);
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
