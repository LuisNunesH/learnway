package com.learnway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code groq.*} from application.yml — provedor de IA reserva (fallback do Gemini).
 */
@ConfigurationProperties(prefix = "groq")
public record GroqProperties(
        String apiKey,
        String baseUrl,
        String model,
        int maxOutputTokens,
        double temperature,
        int timeoutSeconds
) {
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
