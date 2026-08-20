package com.learnway.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.learnway.common.exception.AiUnavailableException;
import com.learnway.common.exception.ExternalServiceException;
import com.learnway.config.GroqProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin client over the Groq {@code /chat/completions} endpoint (OpenAI-compatible).
 *
 * <p>Provedor reserva: usado pelo {@link AiRouter} quando a Gemini não atende.
 * Uma única tentativa, sem retry.
 */
@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);

    private final RestClient groqRestClient;
    private final GroqProperties properties;

    public GroqService(RestClient groqRestClient, GroqProperties properties) {
        this.groqRestClient = groqRestClient;
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    /** Sends a single-prompt request and returns the model's text output. */
    public String generate(String prompt, boolean jsonMode) {
        if (!properties.isConfigured()) {
            throw new ExternalServiceException(
                    "O provedor de IA reserva (Groq) não está configurado. Defina GROQ_API_KEY.");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", properties.model());
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        body.put("temperature", properties.temperature());
        body.put("max_tokens", properties.maxOutputTokens());
        if (jsonMode) {
            // Exige a palavra "JSON" no prompt — todos os prompts de avaliação já a contêm.
            body.put("response_format", Map.of("type", "json_object"));
        }

        try {
            JsonNode response = groqRestClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            return extractText(response);
        } catch (RestClientException ex) {
            throw asDomainException(ex);
        }
    }

    /** Mesma classificação do cliente Gemini: 5xx/429/timeout são do provedor; 4xx é config nossa. */
    private ExternalServiceException asDomainException(RestClientException ex) {
        Integer status = (ex instanceof HttpStatusCodeException httpEx)
                ? httpEx.getStatusCode().value()
                : null;
        boolean providerDown = ex instanceof ResourceAccessException
                || (status != null && (status >= 500 || status == 429));

        if (providerDown) {
            log.warn("Groq indisponível (status {}): {}", status, ex.getMessage());
            return new AiUnavailableException("A IA reserva (Groq) está indisponível no momento.", status, ex);
        }
        log.error("Falha ao chamar a Groq API", ex);
        return new ExternalServiceException("Falha ao comunicar com a IA reserva.", ex);
    }

    private String extractText(JsonNode response) {
        if (response == null) {
            throw new ExternalServiceException("Resposta vazia da IA reserva.");
        }
        String text = response.path("choices").path(0).path("message").path("content").asText("").trim();
        if (text.isEmpty()) {
            throw new ExternalServiceException("A IA reserva retornou uma resposta vazia.");
        }
        return text;
    }
}
