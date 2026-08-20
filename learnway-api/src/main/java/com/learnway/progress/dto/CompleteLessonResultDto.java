package com.learnway.progress.dto;

import com.learnway.gamification.dto.AchievementDto;
import com.learnway.progress.entity.LessonStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CompleteLessonResultDto(
        UUID lessonId,
        LessonStatus status,
        BigDecimal scorePercentage,
        int xpEarned,
        boolean firstCompletion,
        OffsetDateTime nextReviewAt,
        List<AchievementDto> newAchievements
) {
}
