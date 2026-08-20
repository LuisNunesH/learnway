package com.learnway.content.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "lesson_questions")
@Getter
@Setter
@NoArgsConstructor
public class LessonQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 50)
    private QuestionType questionType;

    @Column(name = "question_text", columnDefinition = "text", nullable = false)
    private String questionText;

    @Column(name = "theory_hint", columnDefinition = "text")
    private String theoryHint;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "xp_reward", nullable = false)
    private int xpReward = 5;

    @Column(name = "difficulty_level")
    private Short difficultyLevel;
}
