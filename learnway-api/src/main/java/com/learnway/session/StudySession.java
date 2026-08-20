package com.learnway.session;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
}
