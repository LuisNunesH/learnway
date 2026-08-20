package com.learnway.common.exception;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Standard error payload returned to clients.
 */
public record ApiError(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldViolation> violations
) {
    public record FieldViolation(String field, String message) {}

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(OffsetDateTime.now(), status, error, message, path, null);
    }

    public static ApiError of(int status, String error, String message, String path, List<FieldViolation> violations) {
        return new ApiError(OffsetDateTime.now(), status, error, message, path, violations);
    }
}
