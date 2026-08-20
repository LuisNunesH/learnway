package com.learnway.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    Optional<StudySession> findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(UUID userId);

    /** Última sessão do usuário, aberta ou não — usada para tornar /end idempotente. */
    Optional<StudySession> findFirstByUserIdOrderByStartedAtDesc(UUID userId);

    @Query("select coalesce(sum(s.durationMinutes), 0) from StudySession s where s.userId = :userId")
    long totalMinutes(@Param("userId") UUID userId);

    @Query("""
            select coalesce(sum(s.durationMinutes), 0) from StudySession s
            where s.userId = :userId and s.sessionDate >= :from
            """)
    long minutesSince(@Param("userId") UUID userId, @Param("from") LocalDate from);

    @Query("""
            select s.sessionDate as date, coalesce(sum(s.durationMinutes), 0) as minutes
            from StudySession s
            where s.userId = :userId and s.sessionDate >= :from
            group by s.sessionDate
            order by s.sessionDate asc
            """)
    List<DailyMinutesRow> dailyMinutesSince(@Param("userId") UUID userId, @Param("from") LocalDate from);

    interface DailyMinutesRow {
        LocalDate getDate();
        long getMinutes();
    }
}
