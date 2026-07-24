package com.damo.partyschool.knowledge;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record KnowledgeUploadRequest(
        @NotBlank String title,
        @NotNull KbType kbType,
        @NotBlank String content,
        String sourceName) {
}
