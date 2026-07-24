package com.damo.partyschool.exam;

public record ExamView(Long id, String title, ExamStatus status, Long branchId) {

    public static ExamView from(Exam exam) {
        return new ExamView(exam.getId(), exam.getTitle(), exam.getStatus(), exam.getBranchId());
    }
}
