package com.learnway.auth;

import com.learnway.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Issues and validates JWT access/refresh tokens.
 */
@Service
public class JwtService {

    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final SecretKey signingKey;
    private final long accessExpMinutes;
    private final long refreshExpDays;

    public JwtService(JwtProperties properties) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret()));
        this.accessExpMinutes = properties.accessTokenExpirationMinutes();
        this.refreshExpDays = properties.refreshTokenExpirationDays();
    }

    public String generateAccessToken(UUID userId, String username) {
        return buildToken(userId, username, TYPE_ACCESS, Instant.now().plus(accessExpMinutes, ChronoUnit.MINUTES));
    }

    public String generateRefreshToken(UUID userId, String username) {
        return buildToken(userId, username, TYPE_REFRESH, Instant.now().plus(refreshExpDays, ChronoUnit.DAYS));
    }

    public long getAccessTokenExpiresInSeconds() {
        return accessExpMinutes * 60;
    }

    private String buildToken(UUID userId, String username, String type, Instant expiry) {
        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of(CLAIM_USERNAME, username, CLAIM_TYPE, type))
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parse(token).getSubject());
    }

    public String extractUsername(String token) {
        return parse(token).get(CLAIM_USERNAME, String.class);
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(parse(token).get(CLAIM_TYPE, String.class));
    }

    /** @return true if the token is well-formed, correctly signed and not expired. */
    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
