package com.learnway.review;

import com.learnway.common.time.AppClock;
import com.learnway.review.entity.ReviewSchedule;
import com.learnway.review.entity.UrgencyLevel;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Pure SM-2 (SuperMemo 2) scheduling — the algorithm behind Anki.
 * {@code quality} is the self-rated recall, 0..5.
 */
@Service
public class SpacedRepetitionService {

    private static final BigDecimal MIN_EASE_FACTOR = BigDecimal.valueOf(1.3);

    private final AppClock clock;

    public SpacedRepetitionService(AppClock clock) {
        this.clock = clock;
    }

    /** Builds the first schedule right after a lesson is completed. */
    public ReviewSchedule initialSchedule(java.util.UUID userId, java.util.UUID lessonId) {
        ReviewSchedule schedule = new ReviewSchedule();
        schedule.setUserId(userId);
        schedule.setLessonId(lessonId);
        schedule.setRepetitions(0);
        schedule.setIntervalDays(1);
        schedule.setEaseFactor(BigDecimal.valueOf(2.5));
        schedule.setNextReviewAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(1));
        schedule.setUrgencyLevel(UrgencyLevel.NORMAL);
        return schedule;
    }

    /**
     * Applies a review outcome to the schedule, mutating interval, repetitions,
     * ease factor and the next review date in place.
     */
    public ReviewSchedule applyReview(ReviewSchedule schedule, int quality) {
        apply(schedule, quality);
        schedule.setUrgencyLevel(urgencyFor(schedule.getNextReviewAt()));
        return schedule;
    }

    /** Core SM-2 update, shared by lesson reviews and flashcards. */
    public void apply(Sm2Item item, int quality) {
        int q = Math.max(0, Math.min(5, quality));
        double ease = item.getEaseFactor().doubleValue();

        if (q < 3) {
            // Recall failed: reset the repetition cycle, review again tomorrow.
            item.setRepetitions(0);
            item.setIntervalDays(1);
        } else {
            int reps = item.getRepetitions();
            if (reps == 0) {
                item.setIntervalDays(1);
            } else if (reps == 1) {
                item.setIntervalDays(6);
            } else {
                item.setIntervalDays((int) Math.round(item.getIntervalDays() * ease));
            }
            item.setRepetitions(reps + 1);
        }

        // Update the ease factor (clamped to a 1.3 floor).
        double updatedEase = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        BigDecimal clamped = BigDecimal.valueOf(updatedEase).setScale(2, RoundingMode.HALF_UP);
        if (clamped.compareTo(MIN_EASE_FACTOR) < 0) {
            clamped = MIN_EASE_FACTOR;
        }
        item.setEaseFactor(clamped);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        item.setLastReviewedAt(now);
        item.setNextReviewAt(now.plusDays(item.getIntervalDays()));
    }

    /** Classifies how urgent a review is relative to now, no dia civil local. */
    public UrgencyLevel urgencyFor(OffsetDateTime nextReviewAt) {
        LocalDate today = clock.today();
        LocalDate due = clock.dateOf(nextReviewAt);
        if (due.isBefore(today)) return UrgencyLevel.OVERDUE;
        return due.equals(today) ? UrgencyLevel.DUE_TODAY : UrgencyLevel.NORMAL;
    }
}
