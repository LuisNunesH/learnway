package com.learnway.gamification.repository;

import com.learnway.gamification.entity.XpEvent;
import com.learnway.gamification.entity.XpSource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface XpEventRepository extends JpaRepository<XpEvent, UUID> {

    List<XpEvent> findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(UUID userId, OffsetDateTime after);

    long countByUserIdAndSource(UUID userId, XpSource source);

    /**
     * Events of a source per day inside a window (activity calendar counts reviews).
     * O dia é o dia civil em {@code :zone} — agrupar em UTC jogaria a atividade
     * feita depois das 21h de Brasília para o dia seguinte.
     * Agrupa por ordinal: repetir a expressão no group by criaria um segundo
     * placeholder e o Postgres não a reconheceria como a mesma do select.
     */
    @Query(value = """
            select cast(e.created_at at time zone :zone as date) as date, count(*) as total
            from xp_events e
            where e.user_id = :userId and e.source = :source
              and e.created_at >= :from and e.created_at < :to
            group by 1
            """, nativeQuery = true)
    List<DailyCountRow> dailyCountsBySourceBetween(@Param("userId") UUID userId,
                                                   @Param("source") String source,
                                                   @Param("from") OffsetDateTime from,
                                                   @Param("to") OffsetDateTime to,
                                                   @Param("zone") String zone);

    interface DailyCountRow {
        java.time.LocalDate getDate();
        long getTotal();
    }

    /** Aggregated XP per user since a given instant — used by the weekly leaderboard. */
    @Query("""
            select e.userId as userId, sum(e.amount) as totalXp
            from XpEvent e
            where e.createdAt >= :since
            group by e.userId
            order by sum(e.amount) desc
            """)
    List<LeaderboardAggregate> aggregateSince(@Param("since") OffsetDateTime since, Pageable pageable);

    interface LeaderboardAggregate {
        UUID getUserId();
        Long getTotalXp();
    }
}
