package com.learnway.progress;

import com.learnway.content.entity.QuestionType;
import com.learnway.progress.entity.QuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionAttemptRepository extends JpaRepository<QuestionAttempt, UUID> {

    List<QuestionAttempt> findByUserIdAndLessonIdOrderByCreatedAtAsc(UUID userId, UUID lessonId);

    /** Distinct code-challenge questions the user has solved correctly (for code_warrior). */
    @Query("""
            select count(distinct a.questionId) from QuestionAttempt a
            where a.userId = :userId and a.questionType = com.learnway.content.entity.QuestionType.CODE_CHALLENGE
              and a.correct = true
            """)
    long countDistinctCorrectCodeChallenges(@Param("userId") UUID userId);

    /** Multiple-choice questions answered correctly in under 30s (for speed_demon). */
    @Query("""
            select count(a) from QuestionAttempt a
            where a.userId = :userId and a.questionType = com.learnway.content.entity.QuestionType.MULTIPLE_CHOICE
              and a.correct = true and a.timeSpentSeconds is not null and a.timeSpentSeconds < 30
            """)
    long countFastCorrectMultipleChoice(@Param("userId") UUID userId);

    /**
     * Attempts per day inside a window (activity calendar), no fuso {@code :zone}.
     * Agrupa por ordinal: repetir a expressão no group by criaria um segundo
     * placeholder e o Postgres não a reconheceria como a mesma do select.
     */
    @Query(value = """
            select cast(a.created_at at time zone :zone as date) as date, count(*) as total
            from question_attempts a
            where a.user_id = :userId and a.created_at >= :from and a.created_at < :to
            group by 1
            """, nativeQuery = true)
    List<DailyCountRow> dailyCountsBetween(@Param("userId") UUID userId,
                                           @Param("from") java.time.OffsetDateTime from,
                                           @Param("to") java.time.OffsetDateTime to,
                                           @Param("zone") String zone);

    interface DailyCountRow {
        java.time.LocalDate getDate();
        long getTotal();
    }

    /** Accuracy rollup per question type. */
    @Query("""
            select a.questionType as type, count(a) as total, sum(case when a.correct then 1 else 0 end) as correct
            from QuestionAttempt a
            where a.userId = :userId
            group by a.questionType
            """)
    List<AccuracyRow> accuracyByType(@Param("userId") UUID userId);

    interface AccuracyRow {
        QuestionType getType();
        long getTotal();
        long getCorrect();
    }
}
