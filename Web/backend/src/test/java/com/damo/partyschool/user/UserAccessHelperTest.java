package com.damo.partyschool.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.damo.partyschool.auth.UserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserAccessHelperTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserService userService;
    @Autowired UserRepository userRepository;

    @Test
    void secretaryRequireAccessibleUser_sameBranchMember_ok() {
        User member = userRepository.findByUsername("member").orElseThrow();
        User secretary = userRepository.findByUsername("secretary").orElseThrow();
        UserPrincipal actor = new UserPrincipal(secretary);
        User found = userService.requireAccessibleUser(actor, member.getId());
        assertEquals(member.getId(), found.getId());
    }

    @Test
    void unboundSecretaryRequireAccessibleUser_nullBranchMember_denied() {
        User template = userRepository.findByUsername("secretary").orElseThrow();

        User unboundSecretary = new User();
        unboundSecretary.setUsername("unbound_sec");
        unboundSecretary.setPasswordHash(template.getPasswordHash());
        unboundSecretary.setName("未绑定书记");
        unboundSecretary.setRole(Role.SECRETARY);
        unboundSecretary.setBranchId(null);
        unboundSecretary = userRepository.save(unboundSecretary);

        User nullBranchMember = new User();
        nullBranchMember.setUsername("null_branch_mem");
        nullBranchMember.setPasswordHash(template.getPasswordHash());
        nullBranchMember.setName("无支部党员");
        nullBranchMember.setRole(Role.MEMBER);
        nullBranchMember.setBranchId(null);
        nullBranchMember = userRepository.save(nullBranchMember);
        Long nullBranchMemberId = nullBranchMember.getId();

        UserPrincipal actor = new UserPrincipal(unboundSecretary);
        assertThrows(AccessDeniedException.class,
                () -> userService.requireAccessibleUser(actor, nullBranchMemberId));
    }

    @Test
    void secretaryRequireAccessibleUser_otherBranch_denied() throws Exception {
        String adminToken = login("admin", "admin123");
        MvcResult createBranch = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/branches")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"外支部\",\"description\":\"scope-test\"}"))
                .andReturn();
        long otherBranchId = objectMapper.readTree(createBranch.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"username":"other_mem","password":"x12345","name":"外支部党员","role":"MEMBER","branchId":%d}
                                        """.formatted(otherBranchId)))
                .andReturn();

        User other = userRepository.findByUsername("other_mem").orElseThrow();
        User secretary = userRepository.findByUsername("secretary").orElseThrow();
        UserPrincipal actor = new UserPrincipal(secretary);

        assertThrows(AccessDeniedException.class,
                () -> userService.requireAccessibleUser(actor, other.getId()));
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"username\":\"%s\",\"password\":\"%s\"}"
                                        .formatted(username, password)))
                .andReturn();
        JsonNode root = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return root.path("data").path("token").asText();
    }
}
