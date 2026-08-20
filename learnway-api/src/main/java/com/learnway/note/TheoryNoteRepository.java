package com.learnway.note;

import com.learnway.note.entity.TheoryNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TheoryNoteRepository extends JpaRepository<TheoryNote, UUID> {

    Optional<TheoryNote> findByUserIdAndArticleId(UUID userId, String articleId);

    List<TheoryNote> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    void deleteByUserIdAndArticleId(UUID userId, String articleId);
}
