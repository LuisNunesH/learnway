package com.learnway.content.dto;

import com.learnway.content.entity.QuestionType;

import java.util.List;
import java.util.UUID;

/**
 * Client-safe view of a question. Never includes correct flags, explanations,
 * reference answers or solution code.
 */
public record QuestionDto(
        UUID id,
        QuestionType type,
        String questionText,
        String theoryHint,
        int orderIndex,
        int xpReward,
        Short difficultyLevel,
        List<OptionPublicDto> options,          // MULTIPLE_CHOICE only
        CodeChallengePublicDto codeChallenge,   // CODE_CHALLENGE only
        Integer minChars                        // DESCRIPTIVE only
) {
    public record OptionPublicDto(UUID id, String optionText, int orderIndex) {}

    public record CodeChallengePublicDto(
            String initialCode,
            String language,
            List<VisibleTestCase> testCases
    ) {}

    public record VisibleTestCase(String input) {}
}
