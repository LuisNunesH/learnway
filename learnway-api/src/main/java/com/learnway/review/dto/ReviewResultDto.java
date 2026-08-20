package com.learnway.review.dto;

import com.learnway.gamification.dto.AchievementDto;
import com.learnway.review.entity.UrgencyLevel;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ReviewResultDto(
        UUID lessonId,
        int quality,
        int intervalDays,
        int repetitions,
        BigDecimal easeFactor,
        OffsetDateTime nextReviewAt,
        UrgencyLevel urgencyLevel,
        int xpEarned,
        List<AchievementDto> newAchievements
) {
}
