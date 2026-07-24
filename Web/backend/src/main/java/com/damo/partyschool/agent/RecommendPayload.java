package com.damo.partyschool.agent;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RecommendPayload(
        @JsonProperty("user_id") String userId,
        @JsonProperty("branch_id") String branchId,
        String query) {
}
