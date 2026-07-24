package com.damo.partyschool.agent;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RecommendItem(
        String title,
        String reason,
        @JsonProperty("document_id") String documentId) {
}
