package com.damo.partyschool.development;

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
class DevelopmentRecordControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void secretaryCannotCreateForOtherBranchUser() throws Exception {
        String adminToken = login("admin", "admin123");
        long otherBranchId = objectMapper.readTree(
                        mockMvc.perform(post("/api/branches")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"name\":\"发展外支部\",\"description\":\"t\"}"))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        long otherUserId = objectMapper.readTree(
                        mockMvc.perform(post("/api/users")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("""
                                                {"username":"otherDev","password":"x12345","name":"外发展党员","role":"MEMBER","branchId":%d}
                                                """.formatted(otherBranchId)))
                                .andReturn()
                                .getResponse()
                                .getContentAsString())
                .path("data").path("id").asLong();

        String secToken = login("secretary", "sec123");
        mockMvc.perform(post("/api/development-records")
                        .header("Authorization", "Bearer " + secToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":%d,"stage":"ACTIVIST","startDate":"2024-01-01","notes":"test"}
                                """.formatted(otherUserId)))
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
