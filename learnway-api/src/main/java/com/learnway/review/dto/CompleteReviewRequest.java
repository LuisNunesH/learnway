package com.learnway.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * SM-2 self-rated recall quality (0..5):
 * 0-1 very hard / wrong, 2-3 recalled with effort, 4-5 easy.
 */
public record CompleteReviewRequest(
        @NotNull @Min(0) @Max(5) Integer quality
) {
}
