package com.learnway.review.dto;

import com.learnway.review.entity.UrgencyLevel;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReviewDueDto(
        UUID lessonId,
        String lessonTitle,
        String subtopicTitle,
        String topicTitle,
        String topicColorHex,
        OffsetDateTime nextReviewAt,
        UrgencyLevel urgencyLevel,
        int intervalDays,
        int repetitions
) {
}
