package com.learnway.session;

import com.learnway.auth.User;
import com.learnway.auth.UserRepository;
import com.learnway.common.time.AppClock;
import com.learnway.gamification.GamificationService;
import com.learnway.session.dto.SessionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * O cronômetro não pode confiar no /end: aba fechada, queda de rede e celular
 * bloqueado são a regra, não a exceção. Estes testes fixam as garantias que
 * sobram quando o encerramento não chega.
 */
class SessionServiceTest {

    /** 2026-08-20T01:00Z = 19/08 às 22h em Brasília. */
    private static final Instant NOW = Instant.parse("2026-08-20T01:00:00Z");
    private static final UUID USER = UUID.randomUUID();

    private StudySessionRepository sessions;
    private SessionService service;

    @BeforeEach
    void setUp() {
        sessions = mock(StudySessionRepository.class);
        UserRepository users = mock(UserRepository.class);
        GamificationService gamification = mock(GamificationService.class);

        when(sessions.save(any(StudySession.class))).thenAnswer(call -> call.getArgument(0));
        when(users.findById(USER)).thenReturn(Optional.of(new User()));

        AppClock clock = new AppClock("America/Sao_Paulo", Clock.fixed(NOW, ZoneOffset.UTC));
        service = new SessionService(sessions, users, gamification, clock, 240, 10);
    }

    @Test
    void novaSessaoUsaODiaCivilDeBrasilia() {
        when(sessions.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(USER))
                .thenReturn(Optional.empty());

        service.start(USER);

        // 22h de Brasília ainda é dia 19, embora em UTC já seja dia 20.
        assertThat(saved().getSessionDate()).isEqualTo(LocalDate.of(2026, 8, 19));
    }

    @Test
    void sessaoVivaERetomadaEmVezDeRecomecar() {
        StudySession open = open(minutesAgo(30), minutesAgo(1));
        when(sessions.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(USER))
                .thenReturn(Optional.of(open));

        SessionDto dto = service.start(USER);

        assertThat(dto.startedAt()).isEqualTo(open.getStartedAt());
        assertThat(open.getEndedAt()).isNull();
        assertThat(open.getLastSeenAt()).isEqualTo(OffsetDateTime.ofInstant(NOW, ZoneOffset.UTC));
    }

    @Test
    void sessaoAbandonadaEFechadaNoUltimoSinalDeVidaEDaLugarAUmaNova() {
        OffsetDateTime started = minutesAgo(60 * 60);        // dois dias e meio atrás
        OffsetDateTime lastSeen = started.plusMinutes(25);   // até onde houve estudo
        StudySession stale = open(started, lastSeen);
        when(sessions.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(USER))
                .thenReturn(Optional.of(stale));

        SessionDto dto = service.start(USER);

        assertThat(stale.getEndedAt()).isEqualTo(lastSeen);
        assertThat(stale.getDurationMinutes()).isEqualTo(25);
        // A nova sessão começa agora — nada de voltar marcando 60h.
        assertThat(dto.startedAt()).isEqualTo(OffsetDateTime.ofInstant(NOW, ZoneOffset.UTC));
        assertThat(dto.endedAt()).isNull();
    }

    @Test
    void duracaoCreditadaNuncaPassaDoTeto() {
        OffsetDateTime started = minutesAgo(60 * 10);
        StudySession marathon = open(started, OffsetDateTime.ofInstant(NOW, ZoneOffset.UTC));
        when(sessions.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(USER))
                .thenReturn(Optional.of(marathon));

        service.end(USER);

        assertThat(marathon.getDurationMinutes()).isEqualTo(240);
        assertThat(marathon.getEndedAt()).isEqualTo(started.plusMinutes(240));
    }

    @Test
    void encerrarDuasVezesNaoEstouraNemCreditaDeNovo() {
        StudySession finished = open(minutesAgo(30), minutesAgo(30));
        finished.setEndedAt(minutesAgo(10));
        finished.setDurationMinutes(20);
        when(sessions.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(USER))
                .thenReturn(Optional.empty());
        when(sessions.findFirstByUserIdOrderByStartedAtDesc(USER))
                .thenReturn(Optional.of(finished));

        SessionDto dto = service.end(USER);

        assertThat(dto.durationMinutes()).isEqualTo(20);
        verify(sessions, never()).save(any(StudySession.class));
    }

    @Test
    void statsFechamSessaoAbandonadaEmVezDeExibiLaComoAtiva() {
        StudySession stale = open(minutesAgo(600), minutesAgo(570));
        when(sessions.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(USER))
                .thenReturn(Optional.of(stale))
                .thenReturn(Optional.empty());
        when(sessions.dailyMinutesSince(any(), any())).thenReturn(List.of());

        var stats = service.stats(USER);

        assertThat(stale.getEndedAt()).isEqualTo(minutesAgo(570));
        assertThat(stale.getDurationMinutes()).isEqualTo(30);
        assertThat(stats.activeSessionStartedAt()).isNull();
    }

    private StudySession open(OffsetDateTime startedAt, OffsetDateTime lastSeenAt) {
        StudySession session = new StudySession(USER, startedAt, startedAt.toLocalDate());
        session.setLastSeenAt(lastSeenAt);
        return session;
    }

    private OffsetDateTime minutesAgo(long minutes) {
        return OffsetDateTime.ofInstant(NOW, ZoneOffset.UTC).minusMinutes(minutes);
    }

    private StudySession saved() {
        var captor = org.mockito.ArgumentCaptor.forClass(StudySession.class);
        verify(sessions).save(captor.capture());
        return captor.getValue();
    }
}
