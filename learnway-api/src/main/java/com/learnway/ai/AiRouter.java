package com.learnway.ai;

import com.learnway.common.exception.AiUnavailableException;
import com.learnway.common.exception.ExternalServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Roteia as chamadas de IA: tenta a Gemini e, se ela não atender, reenvia a mesma
 * requisição para a Groq. Só devolve erro ao usuário quando ambas falham.
 */
@Service
public class AiRouter {

    private static final Logger log = LoggerFactory.getLogger(AiRouter.class);

    private final GeminiService geminiService;
    private final GroqService groqService;

    public AiRouter(GeminiService geminiService, GroqService groqService) {
        this.geminiService = geminiService;
        this.groqService = groqService;
    }

    public boolean isConfigured() {
        return geminiService.isConfigured() || groqService.isConfigured();
    }

    /** Sends a single-prompt request, falling back to the secondary provider on failure. */
    public String generate(String prompt, boolean jsonMode) {
        ExternalServiceException geminiFailure;
        try {
            return geminiService.generate(prompt, jsonMode);
        } catch (ExternalServiceException ex) {
            geminiFailure = ex;
        }

        if (!groqService.isConfigured()) {
            throw geminiFailure;
        }

        log.warn("Gemini falhou ({}); usando fallback Groq.", geminiFailure.getMessage());
        try {
            return groqService.generate(prompt, jsonMode);
        } catch (ExternalServiceException groqFailure) {
            log.error("Ambos os provedores de IA falharam. Gemini: {} | Groq: {}",
                    geminiFailure.getMessage(), groqFailure.getMessage());
            Integer status = (groqFailure instanceof AiUnavailableException aiEx)
                    ? aiEx.getUpstreamStatus()
                    : null;
            throw new AiUnavailableException(
                    "Os serviços de IA estão indisponíveis no momento (provedor principal e reserva). "
                            + "Isso é temporário e não afeta o restante da plataforma — tente novamente em alguns instantes.",
                    status, groqFailure);
        }
    }
}
