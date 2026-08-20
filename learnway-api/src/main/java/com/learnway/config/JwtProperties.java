package com.learnway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code learnway.jwt.*} from application.yml.
 */
@ConfigurationProperties(prefix = "learnway.jwt")
public record JwtProperties(
        String secret,
        long accessTokenExpirationMinutes,
        long refreshTokenExpirationDays
) {
}
