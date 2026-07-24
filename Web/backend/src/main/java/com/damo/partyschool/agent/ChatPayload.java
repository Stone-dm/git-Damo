package com.damo.partyschool.agent;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ChatPayload(
        @JsonProperty("user_id") String userId,
        @JsonProperty("branch_id") String branchId,
        String role,
        String message,
        @JsonProperty("document_id") String documentId,
        String text,
        List<ChatHistoryItem> history) {
}
