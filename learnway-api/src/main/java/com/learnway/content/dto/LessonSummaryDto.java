package com.learnway.content.dto;

import com.learnway.content.entity.Lesson;

import java.util.UUID;

public record LessonSummaryDto(
        UUID id,
        UUID subtopicId,
        String title,
        int xpReward,
        Short difficultyLevel,
        int orderIndex,
        int estimatedMinutes,
        long questionCount
) {
    public static LessonSummaryDto from(Lesson l, long questionCount) {
        return new LessonSummaryDto(l.getId(), l.getSubtopic().getId(), l.getTitle(),
                l.getXpReward(), l.getDifficultyLevel(), l.getOrderIndex(),
                l.getEstimatedMinutes(), questionCount);
    }
}
