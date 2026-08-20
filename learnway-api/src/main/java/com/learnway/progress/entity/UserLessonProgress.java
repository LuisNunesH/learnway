package com.learnway.progress.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_lesson_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "lesson_id"}))
@Getter
@Setter
@NoArgsConstructor
public class UserLessonProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "lesson_id", nullable = false, columnDefinition = "uuid")
    private UUID lessonId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LessonStatus status = LessonStatus.NOT_STARTED;

    @Column(name = "score_percentage", precision = 5, scale = 2)
    private BigDecimal scorePercentage;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "xp_earned", nullable = false)
    private int xpEarned = 0;

    public UserLessonProgress(UUID userId, UUID lessonId) {
        this.userId = userId;
        this.lessonId = lessonId;
    }
}
