package com.damo.partyschool.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank @Size(max = 64) String username,
        @Size(max = 64) String password,
        @NotBlank @Size(max = 64) String name,
        @NotNull Role role,
        Long branchId) {
}
