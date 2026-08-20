package com.learnway.flashcard.dto;

import com.learnway.gamification.dto.AchievementDto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record FlashcardGradeResultDto(
        UUID flashcardId,
        int quality,
        int intervalDays,
        int repetitions,
        BigDecimal easeFactor,
        OffsetDateTime nextReviewAt,
        int xpEarned,
        List<AchievementDto> newAchievements
) {
}
