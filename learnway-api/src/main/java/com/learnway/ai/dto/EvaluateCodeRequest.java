package com.learnway.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record EvaluateCodeRequest(
        @NotNull UUID questionId,
        @NotBlank String code
) {
}
