package com.learnway.common.exception;

/**
 * Thrown when the AI providers were reached but did not serve the request — model overloaded
 * (503 UNAVAILABLE), rate limited (429), upstream 5xx or network timeout.
 *
 * <p>Distinta de {@link ExternalServiceException}: aqui a aplicação está saudável e a falha é
 * do provedor de IA, então a resposta é 503 (+ {@code Retry-After}) e a mensagem diz ao usuário
 * que o problema é temporário e externo.
 */
public class AiUnavailableException extends ExternalServiceException {

    /** Sugestão de espera enviada no header {@code Retry-After}. */
    public static final int DEFAULT_RETRY_AFTER_SECONDS = 30;

    /** HTTP status devolvido pelo provedor, ou {@code null} se a falha foi de rede/timeout. */
    private final Integer upstreamStatus;

    private final int retryAfterSeconds;

    public AiUnavailableException(String message, Integer upstreamStatus, Throwable cause) {
        this(message, upstreamStatus, DEFAULT_RETRY_AFTER_SECONDS, cause);
    }

    public AiUnavailableException(String message, Integer upstreamStatus, int retryAfterSeconds, Throwable cause) {
        super(message, cause);
        this.upstreamStatus = upstreamStatus;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public Integer getUpstreamStatus() {
        return upstreamStatus;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
