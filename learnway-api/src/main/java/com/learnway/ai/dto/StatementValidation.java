package com.learnway.ai.dto;

/**
 * Veredito da IA sobre uma afirmação do aluno a respeito de um artigo de teoria.
 * verdict: CORRECT | PARTIALLY_CORRECT | INCORRECT
 */
public record StatementValidation(
        String verdict,
        String explanation
) {
}
