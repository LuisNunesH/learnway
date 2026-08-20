package com.learnway.flashcard.entity;

import com.learnway.review.Sm2Item;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Estado SM-2 de um flashcard para um usuário. Criado de forma preguiçosa
 * na primeira avaliação da carta — cartas sem registro são "novas".
 */
@Entity
@Table(name = "flashcard_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "flashcard_id"}))
@Getter
@Setter
@NoArgsConstructor
public class FlashcardProgress implements Sm2Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "flashcard_id", nullable = false, columnDefinition = "uuid")
    private UUID flashcardId;

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

    public FlashcardProgress(UUID userId, UUID flashcardId) {
        this.userId = userId;
        this.flashcardId = flashcardId;
        this.nextReviewAt = OffsetDateTime.now();
    }
}
