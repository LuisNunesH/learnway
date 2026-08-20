package com.learnway.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.learnway.common.exception.AiUnavailableException;
import com.learnway.common.exception.ExternalServiceException;
import com.learnway.config.GeminiProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Thin client over the Google Gemini {@code generateContent} endpoint.
 *
 * <p>Falha rápido: uma única tentativa, sem retry — quem decide o fallback para o
 * provedor reserva é o {@link AiRouter}.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private final RestClient geminiRestClient;
    private final GeminiProperties properties;

    public GeminiService(RestClient geminiRestClient, GeminiProperties properties) {
        this.geminiRestClient = geminiRestClient;
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    /** Sends a single-prompt request and returns the model's text output. */
    public String generate(String prompt, boolean jsonMode) {
        if (!properties.isConfigured()) {
            throw new ExternalServiceException(
                    "A integração com a IA (Gemini) não está configurada. Defina GEMINI_API_KEY.");
        }

        Map<String, Object> generationConfig = new java.util.HashMap<>();
        generationConfig.put("temperature", properties.temperature());
        generationConfig.put("maxOutputTokens", properties.maxOutputTokens());
        if (jsonMode) {
            generationConfig.put("responseMimeType", "application/json");
        }

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", generationConfig
        );

        String uri = "/models/" + properties.model() + ":generateContent?key=" + properties.apiKey();

        try {
            JsonNode response = geminiRestClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            return extractText(response);
        } catch (RestClientException ex) {
            throw asDomainException(ex);
        }
    }

    /**
     * Sobrecarga ({@code 503}), rate limit ({@code 429}), 5xx e timeout de rede são problemas
     * do provedor → {@link AiUnavailableException}. Já 400/401/403 (chave inválida, prompt
     * malformado) são erros de configuração nossos → {@link ExternalServiceException}.
     */
    private ExternalServiceException asDomainException(RestClientException ex) {
        Integer status = (ex instanceof HttpStatusCodeException httpEx)
                ? httpEx.getStatusCode().value()
                : null;
        boolean providerDown = ex instanceof ResourceAccessException
                || (status != null && (status >= 500 || status == 429));

        if (providerDown) {
            log.warn("Gemini indisponível (status {}): {}", status, ex.getMessage());
            return new AiUnavailableException("A IA (Gemini) está indisponível no momento.", status, ex);
        }
        log.error("Falha ao chamar a Gemini API", ex);
        return new ExternalServiceException("Falha ao comunicar com a IA. Tente novamente em instantes.", ex);
    }

    private String extractText(JsonNode response) {
        if (response == null) {
            throw new ExternalServiceException("Resposta vazia da IA.");
        }
        JsonNode candidates = response.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            // Surface safety blocks / errors when present.
            String reason = response.path("promptFeedback").path("blockReason").asText(null);
            throw new ExternalServiceException(reason != null
                    ? "A IA recusou a solicitação (" + reason + ")."
                    : "A IA não retornou nenhum candidato de resposta.");
        }
        JsonNode parts = candidates.get(0).path("content").path("parts");
        StringBuilder sb = new StringBuilder();
        if (parts.isArray()) {
            for (JsonNode part : parts) {
                sb.append(part.path("text").asText(""));
            }
        }
        String text = sb.toString().trim();
        if (text.isEmpty()) {
            throw new ExternalServiceException("A IA retornou uma resposta vazia.");
        }
        return text;
    }
}
