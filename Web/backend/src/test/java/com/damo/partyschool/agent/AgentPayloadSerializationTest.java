package com.damo.partyschool.agent;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Contract tests: Backend → Agent JSON field names must be snake_case and match Agent Pydantic models.
 */
class AgentPayloadSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void ingestPayloadUsesAgentFieldNamesAndCoercesNullBranchId() throws Exception {
        IngestPayload payload = AgentPayloads.ingest("1", "LEARNING", "学习要点", "3", null);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(payload));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder(
                "document_id", "kb_type", "text", "user_id", "branch_id");
        assertThat(json.get("document_id").asText()).isEqualTo("1");
        assertThat(json.get("kb_type").asText()).isEqualTo("LEARNING");
        assertThat(json.get("text").asText()).isEqualTo("学习要点");
        assertThat(json.get("user_id").asText()).isEqualTo("3");
        assertThat(json.get("branch_id").asText()).isEqualTo("");
        assertThat(json.get("branch_id").isNull()).isFalse();
    }

    @Test
    void recommendPayloadUsesAgentFieldNamesAndDefaultQuery() throws Exception {
        RecommendPayload payload = AgentPayloads.recommend("3", null, "  ");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(payload));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder(
                "user_id", "branch_id", "query");
        assertThat(json.get("user_id").asText()).isEqualTo("3");
        assertThat(json.get("branch_id").asText()).isEqualTo("");
        assertThat(json.get("query").asText()).isEqualTo("推荐学习");
    }

    @Test
    void chatPayloadUsesAgentFieldNames() throws Exception {
        ChatPayload payload = AgentPayloads.chat(
                "3",
                "1",
                "MEMBER",
                "帮我总结",
                "10",
                "文档正文",
                List.of(new ChatHistoryItem("user", "你好")));

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(payload));

        assertThat(json.fieldNames()).toIterable().containsExactlyInAnyOrder(
                "user_id", "branch_id", "role", "message", "document_id", "text", "history");
        assertThat(json.get("user_id").asText()).isEqualTo("3");
        assertThat(json.get("branch_id").asText()).isEqualTo("1");
        assertThat(json.get("role").asText()).isEqualTo("MEMBER");
        assertThat(json.get("message").asText()).isEqualTo("帮我总结");
        assertThat(json.get("document_id").asText()).isEqualTo("10");
        assertThat(json.get("text").asText()).isEqualTo("文档正文");
        assertThat(json.get("history").isArray()).isTrue();
        assertThat(json.get("history").get(0).get("role").asText()).isEqualTo("user");
        assertThat(json.get("history").get(0).get("content").asText()).isEqualTo("你好");
    }

    @Test
    void recommendItemDeserializesDocumentIdSnakeCase() throws Exception {
        RecommendItem item = objectMapper.readValue(
                "{\"title\":\"t\",\"reason\":\"r\",\"document_id\":\"42\"}",
                RecommendItem.class);

        assertThat(item.title()).isEqualTo("t");
        assertThat(item.reason()).isEqualTo("r");
        assertThat(item.documentId()).isEqualTo("42");
    }
}
