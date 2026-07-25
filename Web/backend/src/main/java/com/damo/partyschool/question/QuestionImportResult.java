package com.damo.partyschool.question;

import java.util.List;

public record QuestionImportResult(
        int parsedCount,
        List<String> errors,
        List<QuestionView> questions) {
}
