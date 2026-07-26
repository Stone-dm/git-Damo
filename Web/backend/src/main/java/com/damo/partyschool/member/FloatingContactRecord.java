package com.damo.partyschool.member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "floating_contact_records")
@Getter
@Setter
@NoArgsConstructor
public class FloatingContactRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 关联 User.id */
    @Column(nullable = false)
    private Long userId;

    /** 联系时间 */
    @Column(nullable = false)
    private LocalDate contactDate;

    /** 联系方式: PHONE / WECHAT / VISIT / LETTER */
    @Column(nullable = false, length = 16)
    private String contactMethod;

    /** 联系内容摘要 */
    @Column(length = 500)
    private String summary;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
