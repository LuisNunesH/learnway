package com.learnway.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record EvaluateDescriptiveRequest(
        @NotNull UUID questionId,
        @NotNull @Size(min = 50, message = "A resposta deve ter ao menos 50 caracteres") String answer
) {
}
