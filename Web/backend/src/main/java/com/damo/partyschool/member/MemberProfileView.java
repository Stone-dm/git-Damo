package com.damo.partyschool.member;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public record MemberProfileView(
        Long id,
        Long userId,
        String userName,
        Long branchId,
        String branchName,
        String gender,
        String ethnicity,
        String birthDate,
        String idCard,
        String phone,
        String education,
        String degree,
        String workplace,
        String position,
        String joinDate,
        String formalDate,
        MemberStatus memberStatus,
        String floatingLocation,
        String floatingStartDate,
        String floatingReason,
        String floatingExpectedReturn,
        String floatingContact,
        String currentStage) {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static MemberProfileView from(MemberProfile p, String userName, Long branchId, String branchName, String currentStage) {
        return new MemberProfileView(
                p.getId(),
                p.getUserId(),
                userName,
                branchId,
                branchName,
                p.getGender(),
                p.getEthnicity(),
                p.getBirthDate() != null ? p.getBirthDate().format(FMT) : null,
                p.getIdCard(),
                p.getPhone(),
                p.getEducation(),
                p.getDegree(),
                p.getWorkplace(),
                p.getPosition(),
                p.getJoinDate() != null ? p.getJoinDate().format(FMT) : null,
                p.getFormalDate() != null ? p.getFormalDate().format(FMT) : null,
                p.getMemberStatus(),
                p.getFloatingLocation(),
                p.getFloatingStartDate() != null ? p.getFloatingStartDate().format(FMT) : null,
                p.getFloatingReason(),
                p.getFloatingExpectedReturn() != null ? p.getFloatingExpectedReturn().format(FMT) : null,
                p.getFloatingContact(),
                currentStage);
    }
}
