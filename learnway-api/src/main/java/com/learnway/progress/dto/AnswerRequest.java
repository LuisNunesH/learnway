package com.learnway.progress.dto;

import java.util.UUID;

/**
 * One payload for all question types — the relevant field is chosen by the question's type.
 *  - MULTIPLE_CHOICE -> selectedOptionId
 *  - DESCRIPTIVE     -> answerText
 *  - CODE_CHALLENGE  -> code
 */
public record AnswerRequest(
        UUID selectedOptionId,
        String answerText,
        String code,
        Integer timeSpentSeconds
) {
}
