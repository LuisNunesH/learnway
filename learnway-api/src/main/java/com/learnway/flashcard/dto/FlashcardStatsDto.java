package com.learnway.flashcard.dto;

import java.time.OffsetDateTime;

/** Visão geral das cartas do usuário (lições concluídas). */
public record FlashcardStatsDto(
        int totalCards,
        int newCards,
        int dueCards,
        OffsetDateTime nextReviewAt
) {
}
