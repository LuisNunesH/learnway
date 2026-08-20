package com.learnway.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Pergunta livre sobre um artigo de teoria. O artigo vive no frontend, então o
 * conteúdo viaja junto — como em {@link ValidateStatementRequest}.
 */
public record AskTheoryRequest(
        @NotBlank @Size(max = 200) String articleTitle,
        @NotBlank @Size(max = 30000) String articleContent,
        @NotBlank @Size(min = 3, max = 1000) String question,
        @Valid @Size(max = 40) List<ChatTurn> history
) {
}
