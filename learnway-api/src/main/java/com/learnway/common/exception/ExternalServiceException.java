package com.learnway.common.exception;

/** Thrown when an upstream dependency (e.g. Gemini API) fails. Maps to HTTP 502. */
public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String message) {
        super(message);
    }

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
