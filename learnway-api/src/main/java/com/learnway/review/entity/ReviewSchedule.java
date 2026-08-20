package com.learnway.review.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "review_schedules",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "lesson_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ReviewSchedule implements com.learnway.review.Sm2Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "lesson_id", nullable = false, columnDefinition = "uuid")
    private UUID lessonId;

    @Column(name = "next_review_at", nullable = false)
    private OffsetDateTime nextReviewAt;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays = 1;

    @Column(name = "ease_factor", nullable = false, precision = 4, scale = 2)
    private BigDecimal easeFactor = BigDecimal.valueOf(2.5);

    @Column(nullable = false)
    private int repetitions = 0;

    @Column(name = "last_reviewed_at")
    private OffsetDateTime lastReviewedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_level", nullable = false, length = 20)
    private UrgencyLevel urgencyLevel = UrgencyLevel.NORMAL;
}
