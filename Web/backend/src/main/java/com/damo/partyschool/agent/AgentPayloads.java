package com.damo.partyschool.agent;

import java.util.List;

/**
 * Builds Agent-facing payloads with snake_case JSON fields and non-null strings
 * so FastAPI/Pydantic does not reject {@code null} for required {@code str} fields.
 */
public final class AgentPayloads {

    public static final String DEFAULT_RECOMMEND_QUERY = "推荐学习";

    private AgentPayloads() {
    }

    public static IngestPayload ingest(
            String documentId,
            String kbType,
            String text,
            String userId,
            String branchId) {
        return new IngestPayload(
                documentId,
                kbType,
                text,
                emptyIfBlank(userId),
                emptyIfBlank(branchId));
    }

    public static RecommendPayload recommend(String userId, String branchId, String query) {
        return new RecommendPayload(
                emptyIfBlank(userId),
                emptyIfBlank(branchId),
                blankToDefault(query, DEFAULT_RECOMMEND_QUERY));
    }

    public static ChatPayload chat(
            String userId,
            String branchId,
            String role,
            String message,
            String documentId,
            String text,
            List<ChatHistoryItem> history) {
        return new ChatPayload(
                emptyIfBlank(userId),
                emptyIfBlank(branchId),
                role == null || role.isBlank() ? "MEMBER" : role.trim(),
                message,
                documentId,
                text,
                history == null ? List.of() : history);
    }

    static String emptyIfBlank(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    static String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }
}
