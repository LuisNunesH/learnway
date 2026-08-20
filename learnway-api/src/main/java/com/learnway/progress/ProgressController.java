package com.learnway.progress;

import com.learnway.common.security.SecurityUtils;
import com.learnway.progress.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress", description = "Trilha, início/conclusão de lições e respostas")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/trail")
    @Operation(summary = "Mapa de trilha com o estado de cada nó (bloqueado/disponível/concluído/revisar)")
    public TrailDto trail() {
        return progressService.buildTrail(SecurityUtils.currentUserId());
    }

    @PostMapping("/lesson/{lessonId}/start")
    @Operation(summary = "Marca a lição como em progresso")
    public LessonProgressDto start(@PathVariable UUID lessonId) {
        return progressService.startLesson(SecurityUtils.currentUserId(), lessonId);
    }

    @PostMapping("/lesson/{lessonId}/complete")
    @Operation(summary = "Conclui a lição: calcula score, concede XP e acende o cristal de revisão")
    public CompleteLessonResultDto complete(@PathVariable UUID lessonId) {
        return progressService.completeLesson(SecurityUtils.currentUserId(), lessonId);
    }

    @PostMapping("/question/{questionId}/answer")
    @Operation(summary = "Responde uma questão (MC determinístico; descritiva/código via IA)")
    public AnswerResultDto answer(@PathVariable UUID questionId, @RequestBody AnswerRequest request) {
        return progressService.answerQuestion(SecurityUtils.currentUserId(), questionId, request);
    }
}
