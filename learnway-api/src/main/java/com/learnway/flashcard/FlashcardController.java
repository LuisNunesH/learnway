package com.learnway.flashcard;

import com.learnway.common.security.SecurityUtils;
import com.learnway.flashcard.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcards")
@Tag(name = "Flashcards", description = "Cartas de conceitos com repetição espaçada por carta (estilo Anki)")
public class FlashcardController {

    private final FlashcardService flashcardService;

    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
    }

    @GetMapping("/decks")
    @Operation(summary = "Baralhos do usuário (um por lição concluída) com contagens de cartas novas e vencidas")
    public List<FlashcardDeckDto> decks() {
        return flashcardService.decks(SecurityUtils.currentUserId());
    }

    @GetMapping("/due")
    @Operation(summary = "Cartas prontas para estudo (vencidas + novas), opcionalmente de uma única lição")
    public List<FlashcardDueDto> due(@RequestParam(required = false) UUID lessonId) {
        return flashcardService.due(SecurityUtils.currentUserId(), lessonId);
    }

    @PostMapping("/{flashcardId}/grade")
    @Operation(summary = "Registra a autoavaliação de uma carta e reagenda pelo SM-2")
    public FlashcardGradeResultDto grade(@PathVariable UUID flashcardId,
                                         @Valid @RequestBody GradeFlashcardRequest request) {
        return flashcardService.grade(SecurityUtils.currentUserId(), flashcardId, request.quality());
    }

    @GetMapping("/stats")
    @Operation(summary = "Totais de cartas (novas, para revisar) do usuário")
    public FlashcardStatsDto stats() {
        return flashcardService.stats(SecurityUtils.currentUserId());
    }
}
