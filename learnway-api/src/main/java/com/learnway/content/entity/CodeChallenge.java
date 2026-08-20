package com.learnway.content.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "code_challenges")
@Getter
@Setter
@NoArgsConstructor
public class CodeChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private LessonQuestion question;

    @Column(name = "initial_code", columnDefinition = "text")
    private String initialCode;

    @Column(name = "solution_code", columnDefinition = "text")
    private String solutionCode;

    /** Raw JSON array of test cases: [{"input": "...", "expected_output": "..."}]. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "test_cases", columnDefinition = "jsonb")
    private String testCases;

    @Column(nullable = false, length = 50)
    private String language = "java";

    @Column(name = "validation_prompt", columnDefinition = "text")
    private String validationPrompt;
}
