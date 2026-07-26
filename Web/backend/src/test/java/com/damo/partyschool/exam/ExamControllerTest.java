package com.damo.partyschool.exam;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExamControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;

    @Test
    void secretaryCreateExam_forcesOwnBranchId() throws Exception {
        User secretary = userRepository.findByUsername("secretary").orElseThrow();
        long ownBranchId = secretary.getBranchId();
        String token = login("secretary", "sec123");
        MvcResult r = mockMvc.perform(post("/api/exams")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"本支部考\",\"status\":\"DRAFT\",\"branchId\":99999}"))
                .andExpect(status().isOk())
                .andReturn();
        long branchId = objectMapper.readTree(r.getResponse().getContentAsString())
                .path("data").path("branchId").asLong();
        assertEquals(ownBranchId, branchId);
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
