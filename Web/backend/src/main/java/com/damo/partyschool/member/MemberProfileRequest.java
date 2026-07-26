package com.damo.partyschool.member;

import java.time.LocalDate;

public record MemberProfileRequest(
        Long userId,
        String name,
        String gender,
        String ethnicity,
        LocalDate birthDate,
        String idCard,
        String phone,
        String education,
        String degree,
        String workplace,
        String position,
        LocalDate joinDate,
        LocalDate formalDate,
        MemberStatus memberStatus,
        String floatingLocation,
        LocalDate floatingStartDate,
        String floatingReason,
        LocalDate floatingExpectedReturn,
        String floatingContact) {
}
