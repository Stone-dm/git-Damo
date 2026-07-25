package com.damo.partyschool.question;

public record QuestionView(
        Long id,
        String stem,
        QuestionType type,
        String optionsJson,
        String answer,
        String analysis,
        int score,
        int orderNum) {

    public static QuestionView from(Question q) {
        return new QuestionView(
                q.getId(), q.getStem(), q.getType(),
                q.getOptionsJson(), q.getAnswer(), q.getAnalysis(),
                q.getScore(), q.getOrderNum());
    }
}
