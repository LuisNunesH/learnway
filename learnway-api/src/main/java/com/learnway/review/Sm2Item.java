package com.learnway.review;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Anything schedulable pelo SM-2: revisões de lição ({@code ReviewSchedule})
 * e flashcards ({@code FlashcardProgress}) compartilham o mesmo estado.
 */
public interface Sm2Item {

    int getIntervalDays();

    void setIntervalDays(int intervalDays);

    BigDecimal getEaseFactor();

    void setEaseFactor(BigDecimal easeFactor);

    int getRepetitions();

    void setRepetitions(int repetitions);

    OffsetDateTime getNextReviewAt();

    void setNextReviewAt(OffsetDateTime nextReviewAt);

    void setLastReviewedAt(OffsetDateTime lastReviewedAt);
}
