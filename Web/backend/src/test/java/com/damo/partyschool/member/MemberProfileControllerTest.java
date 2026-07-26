package com.damo.partyschool.member;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
class MemberProfileControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void secretaryListWithoutBranchId_onlyOwnBranch() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = objectMapper.readTree(
                        mockMvc.perform(post("/api/branches")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"name\":\"列表外支部\",\"description\":\"t\"}"))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"list_other","password":"x12345","name":"列表外党员","role":"MEMBER","branchId":%d}
                                """.formatted(otherBranchId)))
                .andReturn();

        String token = login("secretary", "sec123");
        long ownBranchId = objectMapper.readTree(
                        mockMvc.perform(get("/api/branches").header("Authorization", "Bearer " + token))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").get(0).path("id").asLong();

        MvcResult listResult = mockMvc.perform(get("/api/member-profiles").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        JsonNode data = objectMapper.readTree(listResult.getResponse().getContentAsString()).path("data");
        for (JsonNode item : data) {
            assertEquals(ownBranchId, item.path("branchId").asLong());
        }
    }

    @Test
    void secretaryCannotSaveOtherBranchMember() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = objectMapper.readTree(
                        mockMvc.perform(post("/api/branches")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"name\":\"档案外支部\",\"description\":\"t\"}"))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        long otherUserId = objectMapper.readTree(
                        mockMvc.perform(post("/api/users")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("""
                                                {"username":"arch_other","password":"x12345","name":"外","role":"MEMBER","branchId":%d}
                                                """.formatted(otherBranchId)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        String secToken = login("secretary", "sec123");
        mockMvc.perform(post("/api/member-profiles")
                        .header("Authorization", "Bearer " + secToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":%d,\"phone\":\"13800000000\"}".formatted(otherUserId)))
                .andExpect(status().isForbidden());
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
