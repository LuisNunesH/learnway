package com.learnway.content.dto;

import java.util.List;
import java.util.UUID;

public record LessonDetailDto(
        UUID id,
        UUID subtopicId,
        String title,
        String theoryContent,
        int xpReward,
        Short difficultyLevel,
        int estimatedMinutes,
        List<QuestionDto> questions
) {
}
