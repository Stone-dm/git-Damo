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
        String floatingLocation) {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static MemberProfileView from(MemberProfile p, String userName, Long branchId, String branchName) {
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
                p.getFloatingLocation());
    }
}
