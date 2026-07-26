package com.damo.partyschool.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void secretaryCreateIgnoresAllAndForeignBranches() throws Exception {
        String token = login("secretary", "sec123");
        long ownBranchId = getOwnBranchId(token);

        MvcResult result = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"越权任务","type":"LEARNING","targetType":"ALL","targetBranchIds":[999]}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertEquals("BRANCH", data.path("targetType").asText());
        assertEquals(1, data.path("targetBranchIds").size());
        assertEquals(ownBranchId, data.path("targetBranchIds").get(0).asLong());
    }

    @Test
    void secretaryCannotDispatchForeignBranchTask() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = createBranch(adminToken, "任务外支部");

        long taskId = objectMapper.readTree(
                        mockMvc.perform(post("/api/tasks")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("""
                                                {"title":"外支部草稿","type":"LEARNING","targetType":"BRANCH","targetBranchIds":[%d]}
                                                """.formatted(otherBranchId)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        String secToken = login("secretary", "sec123");
        mockMvc.perform(post("/api/tasks/%d/dispatch".formatted(taskId))
                        .header("Authorization", "Bearer " + secToken))
                .andExpect(status().isForbidden());
    }

    private long getOwnBranchId(String token) throws Exception {
        JsonNode me = objectMapper.readTree(
                        mockMvc.perform(get("/api/me")
                                        .header("Authorization", "Bearer " + token))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data");
        if (me.hasNonNull("branchId")) {
            return me.path("branchId").asLong();
        }
        // fallback: secretary user from /api/users list
        JsonNode users = objectMapper.readTree(
                        mockMvc.perform(get("/api/users")
                                        .header("Authorization", "Bearer " + token))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data");
        assertTrue(users.isArray() && users.size() > 0);
        return users.get(0).path("branchId").asLong();
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

    private String login(String u, String p) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(u, p)))
                .andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
