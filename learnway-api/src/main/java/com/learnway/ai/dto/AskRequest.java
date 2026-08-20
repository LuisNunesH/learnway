package com.learnway.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AskRequest(
        UUID lessonId,
        @NotBlank @Size(min = 3, max = 1000) String question
) {
}
