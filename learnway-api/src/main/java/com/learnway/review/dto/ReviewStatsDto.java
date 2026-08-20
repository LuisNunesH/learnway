package com.learnway.review.dto;

import java.time.OffsetDateTime;

public record ReviewStatsDto(
        long totalScheduled,
        long crystalsToReview,  // due now (next_review_at <= now)
        long overdue,
        long dueToday,
        OffsetDateTime nextReviewAt
) {
}
