package com.learnway.common.exception;

/** Thrown when a requested entity cannot be found. Maps to HTTP 404. */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String entity, Object id) {
        super(entity + " not found: " + id);
    }
}
