package com.learnway.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Uma fala já trocada no chat, reenviada pelo frontend para dar continuidade à
 * conversa (a API é sem estado). role: "user" ou "ai".
 */
public record ChatTurn(
        @NotBlank @Size(max = 10) String role,
        @NotBlank @Size(max = 12000) String text
) {
}
