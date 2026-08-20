package com.learnway.common.exception;

/** Thrown for client-side validation/business errors. Maps to HTTP 400. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
