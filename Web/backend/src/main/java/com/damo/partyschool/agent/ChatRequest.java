package com.damo.partyschool.agent;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        @NotBlank String message,
        Long documentId,
        String text,
        List<ChatHistoryItem> history) {
}
