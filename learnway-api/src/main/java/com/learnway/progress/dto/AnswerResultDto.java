package com.learnway.progress.dto;

import com.learnway.ai.dto.CodeEvaluation;
import com.learnway.ai.dto.DescriptiveEvaluation;
import com.learnway.content.entity.QuestionType;
import com.learnway.gamification.dto.AchievementDto;

import java.util.List;
import java.util.UUID;

public record AnswerResultDto(
        UUID questionId,
        QuestionType type,
        boolean correct,
        int score,
        int xpEarned,
        // MULTIPLE_CHOICE
        UUID selectedOptionId,
        UUID correctOptionId,
        List<OptionFeedback> options,
        // DESCRIPTIVE / CODE_CHALLENGE
        DescriptiveEvaluation descriptiveEvaluation,
        CodeEvaluation codeEvaluation,
        List<AchievementDto> newAchievements
) {
    public record OptionFeedback(UUID id, String text, boolean correct, String explanation, boolean selected) {}
}
