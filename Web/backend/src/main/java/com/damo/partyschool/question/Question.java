package com.damo.partyschool.question;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long examId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String stem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QuestionType type;

    /** JSON array of option strings, e.g. ["A. xxx", "B. xxx", "C. xxx", "D. xxx"] */
    @Column(columnDefinition = "TEXT")
    private String optionsJson;

    @Column(length = 500)
    private String answer;

    @Column(columnDefinition = "TEXT")
    private String analysis;

    private int score = 1;

    private int orderNum;
}
