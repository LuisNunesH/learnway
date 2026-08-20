package com.learnway.note.dto;

import com.learnway.note.entity.TheoryNote;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveTheoryNoteRequest(
        @NotBlank(message = "A anotação não pode ficar vazia.")
        @Size(max = TheoryNote.MAX_CONTENT_LENGTH,
              message = "A anotação pode ter no máximo " + TheoryNote.MAX_CONTENT_LENGTH + " caracteres.")
        String content
) {
}
