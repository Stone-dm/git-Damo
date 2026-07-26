package com.damo.partyschool.cultivation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 培养联系人关系（如入党介绍人） */
@Entity
@Table(name = "cultivation_contacts")
@Getter
@Setter
@NoArgsConstructor
public class CultivationContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 培养联系人 User.id */
    @Column(nullable = false)
    private Long mentorUserId;

    /** 被培养党员 User.id */
    @Column(nullable = false)
    private Long traineeUserId;

    @Column(length = 32)
    private String role; // 第一介绍人 / 第二介绍人 / 培养联系人

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(length = 500)
    private String notes;
}
