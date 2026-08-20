package com.learnway.review;

import com.learnway.review.entity.ReviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewScheduleRepository extends JpaRepository<ReviewSchedule, UUID> {

    Optional<ReviewSchedule> findByUserIdAndLessonId(UUID userId, UUID lessonId);

    List<ReviewSchedule> findByUserIdOrderByNextReviewAtAsc(UUID userId);

    List<ReviewSchedule> findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(UUID userId, OffsetDateTime when);

    long countByUserId(UUID userId);

    long countByUserIdAndNextReviewAtLessThanEqual(UUID userId, OffsetDateTime when);

    /** All schedules currently due — used by the hourly reminder scheduler. */
    List<ReviewSchedule> findByNextReviewAtLessThanEqual(OffsetDateTime when);
}
