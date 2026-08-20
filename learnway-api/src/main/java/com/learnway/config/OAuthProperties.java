package com.learnway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code learnway.oauth.*} from application.yml.
 *
 * @param frontendRedirectUri para onde o backend redireciona (com os JWTs no fragment)
 *                            após um login social bem-sucedido
 * @param failureRedirectUri  para onde redirecionar quando o login social falha
 */
@ConfigurationProperties(prefix = "learnway.oauth")
public record OAuthProperties(
        String frontendRedirectUri,
        String failureRedirectUri
) {
}
