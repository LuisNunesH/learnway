package com.learnway.flashcard.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Resumo das cartas de uma lição concluída (um "baralho"). */
public record FlashcardDeckDto(
        UUID lessonId,
        String lessonTitle,
        String subtopicTitle,
        String topicTitle,
        String topicColorHex,
        int totalCards,
        int newCards,
        int dueCards,
        OffsetDateTime nextReviewAt
) {
}
