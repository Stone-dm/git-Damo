package com.damo.partyschool.development;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
class DevelopmentRecordControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void secretaryCannotCreateForOtherBranchUser() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = createBranch(adminToken, "发展外支部");
        long otherUserId = createMember(adminToken, "otherDev", "外发展党员", otherBranchId);

        String secToken = login("secretary", "sec123");
        mockMvc.perform(post("/api/development-records")
                        .header("Authorization", "Bearer " + secToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":%d,"stage":"ACTIVIST","startDate":"2024-01-01","notes":"test"}
                                """.formatted(otherUserId)))
                .andExpect(status().isForbidden());
    }

    @Test
    void secretaryList_onlyOwnBranchRecords() throws Exception {
        String adminToken = login("admin", "admin123");
        String secToken = login("secretary", "sec123");

        long ownBranchId = objectMapper.readTree(
                        mockMvc.perform(get("/api/branches").header("Authorization", "Bearer " + secToken))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").get(0).path("id").asLong();

        long otherBranchId = createBranch(adminToken, "列表外支部");
        long otherUserId = createMember(adminToken, "list_other_dev", "列表外发展党员", otherBranchId);
        createRecord(adminToken, otherUserId, "ACTIVIST", "2024-02-01", "other-branch");

        long ownMemberId = createMember(adminToken, "list_own_dev", "列表本支部党员", ownBranchId);
        createRecord(adminToken, ownMemberId, "ACTIVIST", "2024-01-01", "own-branch");

        MvcResult listResult = mockMvc.perform(get("/api/development-records")
                        .header("Authorization", "Bearer " + secToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        JsonNode data = objectMapper.readTree(listResult.getResponse().getContentAsString()).path("data");
        assertFalse(data.isEmpty());
        for (JsonNode item : data) {
            assertTrue(item.path("userId").asLong() != otherUserId);
        }
        boolean hasOwnBranchRecord = false;
        for (JsonNode item : data) {
            if (item.path("userId").asLong() == ownMemberId) {
                hasOwnBranchRecord = true;
                break;
            }
        }
        assertTrue(hasOwnBranchRecord);
    }

    @Test
    void secretaryCannotGetOtherBranchUserRecords() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = createBranch(adminToken, "读取外支部");
        long otherUserId = createMember(adminToken, "read_other_dev", "读取外发展党员", otherBranchId);

        String secToken = login("secretary", "sec123");
        mockMvc.perform(get("/api/development-records/user/" + otherUserId)
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

    private void createRecord(
            String adminToken, long userId, String stage, String startDate, String notes) throws Exception {
        mockMvc.perform(post("/api/development-records")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":%d,"stage":"%s","startDate":"%s","notes":"%s"}
                                """.formatted(userId, stage, startDate, notes)))
                .andExpect(status().isOk());
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
