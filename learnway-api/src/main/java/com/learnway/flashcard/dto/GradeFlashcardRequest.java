package com.learnway.flashcard.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * SM-2 self-rated recall quality (0..5):
 * 0-1 esqueci, 2-3 lembrei com esforço, 4-5 fácil.
 */
public record GradeFlashcardRequest(
        @NotNull @Min(0) @Max(5) Integer quality
) {
}
