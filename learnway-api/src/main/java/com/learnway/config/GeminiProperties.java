package com.learnway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code gemini.*} from application.yml.
 */
@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(
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
