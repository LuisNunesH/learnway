package com.learnway.progress.dto;

import com.learnway.progress.entity.LessonStatus;
import com.learnway.progress.entity.UserLessonProgress;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record LessonProgressDto(
        UUID lessonId,
        LessonStatus status,
        BigDecimal scorePercentage,
        int attempts,
        int xpEarned,
        OffsetDateTime completedAt
) {
    public static LessonProgressDto from(UserLessonProgress p) {
        return new LessonProgressDto(p.getLessonId(), p.getStatus(), p.getScorePercentage(),
                p.getAttempts(), p.getXpEarned(), p.getCompletedAt());
    }
}
