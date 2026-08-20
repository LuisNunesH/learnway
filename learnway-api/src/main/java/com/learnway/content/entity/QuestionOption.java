package com.learnway.content.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "question_options")
@Getter
@Setter
@NoArgsConstructor
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private LessonQuestion question;

    @Column(name = "option_text", columnDefinition = "text", nullable = false)
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(columnDefinition = "text")
    private String explanation;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;
}
