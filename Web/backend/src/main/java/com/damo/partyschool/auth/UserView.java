package com.damo.partyschool.auth;

import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;

public record UserView(
        Long id,
        String username,
        String name,
        Role role,
        Long branchId) {

    public static UserView from(User user) {
        return new UserView(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getRole(),
                user.getBranchId());
    }

    public static UserView from(UserPrincipal principal) {
        return new UserView(
                principal.getId(),
                principal.getUsername(),
                principal.getName(),
                principal.getRole(),
                principal.getBranchId());
    }
}
