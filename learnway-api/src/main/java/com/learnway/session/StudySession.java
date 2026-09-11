package com.learnway.session;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
@NoArgsConstructor
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "ended_at")
    private OffsetDateTime endedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    /**
     * Último sinal de vida do cliente (heartbeat). Quando a aba morre sem
     * chamar /sessions/end, é aqui que a sessão é fechada — sem isso o
     * tempo continuaria correndo até o próximo acesso.
     */
    @Column(name = "last_seen_at")
    private OffsetDateTime lastSeenAt;

    /**
     * Início da pausa em curso — o usuário saiu da tela (aba escondida,
     * janela sem foco) e o cronômetro parou. {@code null} enquanto ele
     * está estudando.
     */
    @Column(name = "paused_at")
    private OffsetDateTime pausedAt;

    /** Tempo já acumulado fora da tela; descontado da duração creditada. */
    @Column(name = "away_seconds", nullable = false)
    private int awaySeconds = 0;

    /** @param sessionDate o dia civil no fuso da aplicação (ver AppClock). */
    public StudySession(UUID userId, OffsetDateTime startedAt, LocalDate sessionDate) {
        this.userId = userId;
        this.startedAt = startedAt;
        this.sessionDate = sessionDate;
        this.lastSeenAt = startedAt;
    }

    /** Último sinal de vida conhecido — cai no início da sessão se nunca houve heartbeat. */
    public OffsetDateTime lastSeenOrStart() {
        return lastSeenAt == null ? startedAt : lastSeenAt;
    }

    /** O usuário está fora da tela agora? */
    public boolean isPaused() {
        return pausedAt != null;
    }

    /**
     * Segundos de estudo real até {@code instant}: o intervalo desde o início
     * menos tudo o que se passou fora da tela (inclusive a pausa em curso).
     */
    public long activeSecondsAt(OffsetDateTime instant) {
        OffsetDateTime until = isPaused() && pausedAt.isBefore(instant) ? pausedAt : instant;
        long span = Duration.between(startedAt, until).toSeconds();
        return Math.max(0, span - awaySeconds);
    }
}
