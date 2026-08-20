package com.learnway.note;

import com.learnway.common.security.SecurityUtils;
import com.learnway.note.dto.SaveTheoryNoteRequest;
import com.learnway.note.dto.TheoryNoteDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theory-notes")
@Tag(name = "Anotações de teoria", description = "Anotações pessoais por assunto da página de teoria")
public class TheoryNoteController {

    private final TheoryNoteService theoryNoteService;

    public TheoryNoteController(TheoryNoteService theoryNoteService) {
        this.theoryNoteService = theoryNoteService;
    }

    @GetMapping
    @Operation(summary = "Todas as anotações do usuário, mais recentes primeiro")
    public List<TheoryNoteDto> myNotes() {
        return theoryNoteService.myNotes(SecurityUtils.currentUserId());
    }

    @PutMapping("/{articleId}")
    @Operation(summary = "Cria ou substitui a anotação do usuário para um assunto")
    public TheoryNoteDto save(@PathVariable String articleId,
                              @Valid @RequestBody SaveTheoryNoteRequest request) {
        return theoryNoteService.save(SecurityUtils.currentUserId(), articleId, request.content());
    }

    @DeleteMapping("/{articleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Apaga a anotação do usuário para um assunto")
    public void delete(@PathVariable String articleId) {
        theoryNoteService.delete(SecurityUtils.currentUserId(), articleId);
    }
}
