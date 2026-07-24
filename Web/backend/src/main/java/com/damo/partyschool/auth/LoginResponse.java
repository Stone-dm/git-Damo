package com.damo.partyschool.auth;

public record LoginResponse(String token, UserView user) {
}
