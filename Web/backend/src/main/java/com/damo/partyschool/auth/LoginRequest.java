package com.damo.partyschool.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password,
        /** Optional: "WEB" | "MOBILE". Null/blank allows all roles (tests/curl). */
        String client) {
}
