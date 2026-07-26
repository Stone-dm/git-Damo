package com.damo.partyschool.training;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "training_plans")
@Getter
@Setter
@NoArgsConstructor
public class TrainingPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    /** 培养类型：THEORY（理论学习）、PRACTICE（实践锻炼）、EDUCATION（党性教育） */
    @Column(nullable = false, length = 32)
    private String planType; // THEORY / PRACTICE / EDUCATION

    /** 计划状态：DRAFT / ACTIVE */
    @Column(nullable = false, length = 16)
    private String status = "DRAFT";

    /** 截止日期（可选） */
    private LocalDate deadline;

    /** 关联发展阶段（可选，如 APPLICANT / ACTIVIST 等） */
    @Column(length = 32)
    private String relatedStage;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
