package com.learnway.note.dto;

import java.time.OffsetDateTime;

public record TheoryNoteDto(
        String articleId,
        String content,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
