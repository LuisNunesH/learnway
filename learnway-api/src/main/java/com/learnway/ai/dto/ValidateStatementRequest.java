package com.learnway.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ValidateStatementRequest(
        @NotBlank @Size(max = 200) String articleTitle,
        @NotBlank @Size(max = 30000) String articleContent,
        @NotBlank @Size(min = 3, max = 1000) String statement
) {
}
