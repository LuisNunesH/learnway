package com.learnway.content.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "descriptive_answers")
@Getter
@Setter
@NoArgsConstructor
public class DescriptiveAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private LessonQuestion question;

    @Column(name = "reference_answer", columnDefinition = "text", nullable = false)
    private String referenceAnswer;

    @Column(name = "evaluation_criteria", columnDefinition = "text")
    private String evaluationCriteria;
}
