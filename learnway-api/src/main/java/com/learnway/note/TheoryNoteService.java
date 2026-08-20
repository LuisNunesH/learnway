package com.learnway.note;

import com.learnway.common.exception.BadRequestException;
import com.learnway.note.dto.TheoryNoteDto;
import com.learnway.note.entity.TheoryNote;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Anotações pessoais da página de teoria: uma por usuário+assunto,
 * criada ou sobrescrita no mesmo PUT (upsert) e apagável a qualquer momento.
 */
@Service
public class TheoryNoteService {

    private final TheoryNoteRepository repository;

    public TheoryNoteService(TheoryNoteRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<TheoryNoteDto> myNotes(UUID userId) {
        return repository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(TheoryNoteService::toDto)
                .toList();
    }

    @Transactional
    public TheoryNoteDto save(UUID userId, String articleId, String content) {
        validateArticleId(articleId);
        TheoryNote note = repository.findByUserIdAndArticleId(userId, articleId)
                .orElseGet(() -> new TheoryNote(userId, articleId));
        note.setContent(content.trim());
        note.setUpdatedAt(OffsetDateTime.now());
        return toDto(repository.save(note));
    }

    @Transactional
    public void delete(UUID userId, String articleId) {
        validateArticleId(articleId);
        repository.deleteByUserIdAndArticleId(userId, articleId);
    }

    private static void validateArticleId(String articleId) {
        if (articleId == null || articleId.isBlank()
                || articleId.length() > TheoryNote.MAX_ARTICLE_ID_LENGTH) {
            throw new BadRequestException("Identificador de assunto inválido.");
        }
    }

    private static TheoryNoteDto toDto(TheoryNote note) {
        return new TheoryNoteDto(note.getArticleId(), note.getContent(),
                note.getCreatedAt(), note.getUpdatedAt());
    }
}
