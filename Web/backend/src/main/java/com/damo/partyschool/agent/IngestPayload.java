package com.damo.partyschool.agent;

import com.fasterxml.jackson.annotation.JsonProperty;

public record IngestPayload(
        @JsonProperty("document_id") String documentId,
        @JsonProperty("kb_type") String kbType,
        String text,
        @JsonProperty("user_id") String userId,
        @JsonProperty("branch_id") String branchId) {
}
