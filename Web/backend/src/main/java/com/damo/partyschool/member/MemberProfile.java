package com.damo.partyschool.member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "member_profiles")
@Getter
@Setter
@NoArgsConstructor
public class MemberProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 关联 User.id */
    @Column(nullable = false, unique = true)
    private Long userId;

    // ---- 基础信息 ----

    @Column(length = 8)
    private String gender; // MALE / FEMALE

    @Column(length = 32)
    private String ethnicity; // 民族

    private LocalDate birthDate;

    @Column(length = 18)
    private String idCard; // 身份证号

    @Column(length = 20)
    private String phone;

    // ---- 学历/职业 ----

    @Column(length = 32)
    private String education; // 学历

    @Column(length = 32)
    private String degree; // 学位

    @Column(length = 128)
    private String workplace; // 工作单位

    @Column(length = 64)
    private String position; // 职务

    // ---- 组织信息 ----

    private LocalDate joinDate; // 入党时间

    private LocalDate formalDate; // 转正时间

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MemberStatus memberStatus; // FORMAL / PROBATIONARY / FLOATING

    @Column(length = 128)
    private String floatingLocation; // 流入地（仅流动党员）
}
