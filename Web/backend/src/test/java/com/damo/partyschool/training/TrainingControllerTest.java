package com.damo.partyschool.training;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TrainingControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void secretaryCannotCompleteOtherBranchUser() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = createBranch(adminToken, "培训外支部");
        long otherUserId = createMember(adminToken, "train_other", "外培训党员", otherBranchId);
        long planId = createPlan(adminToken, "季度培训");

        String secToken = login("secretary", "sec123");
        mockMvc.perform(post("/api/training/plans/%d/complete/%d".formatted(planId, otherUserId))
                        .header("Authorization", "Bearer " + secToken))
                .andExpect(status().isForbidden());
    }

    private long createBranch(String adminToken, String name) throws Exception {
        return objectMapper.readTree(
                        mockMvc.perform(post("/api/branches")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"name\":\"%s\",\"description\":\"t\"}".formatted(name)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();
    }

    private long createMember(String adminToken, String username, String name, long branchId) throws Exception {
        return objectMapper.readTree(
                        mockMvc.perform(post("/api/users")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("""
                                                {"username":"%s","password":"x12345","name":"%s","role":"MEMBER","branchId":%d}
                                                """.formatted(username, name, branchId)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();
    }

    private long createPlan(String adminToken, String title) throws Exception {
        return objectMapper.readTree(
                        mockMvc.perform(post("/api/training/plans")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"title\":\"%s\",\"description\":\"t\",\"planType\":\"ONLINE\"}"
                                                .formatted(title)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();
    }

    private String login(String u, String p) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(u, p)))
                .andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
