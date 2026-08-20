package com.learnway.flashcard;

import com.learnway.flashcard.entity.FlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, UUID> {

    Optional<FlashcardProgress> findByUserIdAndFlashcardId(UUID userId, UUID flashcardId);

    List<FlashcardProgress> findByUserIdAndFlashcardIdIn(UUID userId, Collection<UUID> flashcardIds);
}
