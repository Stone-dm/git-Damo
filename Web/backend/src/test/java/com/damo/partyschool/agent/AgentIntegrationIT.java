package com.damo.partyschool.agent;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Live Backend ↔ Agent integration. Enable with {@code AGENT_IT=true}.
 * Requires MySQL (party_school) and Agent at {@code AGENT_BASE_URL} (default http://localhost:8000).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "AGENT_IT", matches = "true")
class AgentIntegrationIT {

    private static final String AGENT_BASE =
            System.getenv().getOrDefault("AGENT_BASE_URL", "http://localhost:8000");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @DynamicPropertySource
    static void liveProps(DynamicPropertyRegistry registry) {
        registry.add("server.port", () -> "8080");
        registry.add("app.agent.base-url", () -> AGENT_BASE);
        registry.add(
                "spring.datasource.url",
                () -> System.getenv().getOrDefault(
                        "MYSQL_URL",
                        "jdbc:mysql://localhost:3306/party_school?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8"));
        registry.add("spring.datasource.username",
                () -> System.getenv().getOrDefault("MYSQL_USER", "party"));
        registry.add("spring.datasource.password",
                () -> System.getenv().getOrDefault("MYSQL_PASSWORD", "party123"));
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQLDialect");
    }

    @BeforeAll
    static void requireAgentUp() throws Exception {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
        HttpRequest request = HttpRequest.newBuilder(URI.create(AGENT_BASE + "/health"))
                .timeout(Duration.ofSeconds(3))
                .GET()
                .build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            assumeTrue(response.statusCode() == 200, "Agent /health not OK at " + AGENT_BASE);
        } catch (Exception ex) {
            assumeTrue(false, "Agent unreachable at " + AGENT_BASE + ": " + ex.getMessage());
        }
    }

    @Test
    void memberUploadRecommendChatAgainstLiveAgent() throws Exception {
        String token = login("member", "mem123");

        MvcResult upload = mockMvc.perform(post("/api/knowledge/upload")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"联调学习材料",
                                  "kbType":"LEARNING",
                                  "content":"党的二十大报告学习要点：坚持党的全面领导，推进高质量发展。",
                                  "sourceName":"it.txt"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn();

        JsonNode uploadData = objectMapper.readTree(upload.getResponse().getContentAsString()).path("data");
        assertThat(uploadData.path("syncStatus").asText()).isEqualTo("SYNCED");

        MvcResult recommend = mockMvc.perform(post("/api/agent/recommend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"query":"推荐学习"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn();

        JsonNode items = objectMapper.readTree(recommend.getResponse().getContentAsString())
                .path("data").path("items");
        assertThat(items.isArray()).isTrue();
        assertThat(items.size()).isGreaterThan(0);
        assertThat(items.get(0).path("title").asText()).isNotBlank();

        MvcResult chat = mockMvc.perform(post("/api/agent/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "message":"帮我总结要点",
                                  "text":"坚持党的全面领导，推进高质量发展。"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn();

        String reply = objectMapper.readTree(chat.getResponse().getContentAsString())
                .path("data").path("reply").asText();
        assertThat(reply).isNotBlank();
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"%s"}
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
