package com.damo.partyschool.partydues;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "party_dues_reminders")
@Getter
@Setter
@NoArgsConstructor
public class PartyDuesReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(name = "dues_month", nullable = false, length = 7)
    private String yearMonth;

    @Column(nullable = false)
    private LocalDateTime remindedAt;

    @Column(nullable = false)
    private Integer remindCount;
}
