package com.learnway.ai;

import com.learnway.ai.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI", description = "Avaliação e tutoria com Google Gemini")
public class AiController {

    private final AiEvaluationService aiEvaluationService;

    public AiController(AiEvaluationService aiEvaluationService) {
        this.aiEvaluationService = aiEvaluationService;
    }

    @PostMapping("/evaluate-descriptive")
    @Operation(summary = "Avalia uma resposta descritiva com a IA")
    public DescriptiveEvaluation evaluateDescriptive(@Valid @RequestBody EvaluateDescriptiveRequest request) {
        return aiEvaluationService.evaluateDescriptive(request.questionId(), request.answer());
    }

    @PostMapping("/evaluate-code")
    @Operation(summary = "Avalia um desafio de código com a IA")
    public CodeEvaluation evaluateCode(@Valid @RequestBody EvaluateCodeRequest request) {
        return aiEvaluationService.evaluateCode(request.questionId(), request.code());
    }

    @PostMapping("/validate-statement")
    @Operation(summary = "Valida uma afirmação do aluno sobre um artigo de teoria")
    public StatementValidation validateStatement(@Valid @RequestBody ValidateStatementRequest request) {
        return aiEvaluationService.validateStatement(
                request.articleTitle(), request.articleContent(), request.statement());
    }

    @PostMapping("/ask")
    @Operation(summary = "Chat contextual: aprofundar um tópico com a IA")
    public AskResponse ask(@Valid @RequestBody AskRequest request) {
        return aiEvaluationService.ask(request.lessonId(), request.question());
    }

    @PostMapping("/ask-theory")
    @Operation(summary = "Chat de dúvidas sobre um artigo de teoria")
    public AskResponse askTheory(@Valid @RequestBody AskTheoryRequest request) {
        return aiEvaluationService.askTheory(
                request.articleTitle(), request.articleContent(), request.question(), request.history());
    }
}
