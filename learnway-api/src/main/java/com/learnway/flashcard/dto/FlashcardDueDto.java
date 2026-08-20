package com.learnway.flashcard.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Carta pronta para estudo: nova (sem progresso) ou com revisão vencida. */
public record FlashcardDueDto(
        UUID flashcardId,
        UUID lessonId,
        String lessonTitle,
        String topicTitle,
        String topicColorHex,
        String frontText,
        String backText,
        boolean isNew,
        int intervalDays,
        int repetitions,
        OffsetDateTime nextReviewAt
) {
}
