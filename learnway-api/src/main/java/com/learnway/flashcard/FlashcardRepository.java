package com.learnway.flashcard;

import com.learnway.flashcard.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {

    List<Flashcard> findByLessonIdInOrderByOrderIndexAsc(Collection<UUID> lessonIds);

    List<Flashcard> findByLessonIdOrderByOrderIndexAsc(UUID lessonId);
}
