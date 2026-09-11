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
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * A linha do tempo que o cliente realmente produz — start, sair da tela,
 * voltar, heartbeat — contra um repositório de verdade (em memória) e um
 * relógio que anda. É o teste que pega o cronômetro voltando para zero no
 * meio da sessão.
 */
class SessionTimelineTest {

    private static final UUID USER = UUID.randomUUID();

    private final List<StudySession> store = new ArrayList<>();
    private Instant now = Instant.parse("2026-09-02T14:00:00Z");
    private SessionService service;

    @BeforeEach
    void setUp() {
        StudySessionRepository sessions = mock(StudySessionRepository.class);
        UserRepository users = mock(UserRepository.class);
        GamificationService gamification = mock(GamificationService.class);
        when(users.findById(USER)).thenReturn(Optional.of(new User()));

        when(sessions.save(any(StudySession.class))).thenAnswer(call -> {
            StudySession s = call.getArgument(0);
            if (!store.contains(s)) store.add(s);
            return s;
        });
        when(sessions.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(USER)).thenAnswer(call ->
                store.stream().filter(s -> s.getEndedAt() == null)
                        .max(Comparator.comparing(StudySession::getStartedAt)));
        when(sessions.findFirstByUserIdOrderByStartedAtDesc(USER)).thenAnswer(call ->
                store.stream().max(Comparator.comparing(StudySession::getStartedAt)));

        AppClock clock = new AppClock("America/Sao_Paulo", new MovingClock());
        service = new SessionService(sessions, users, gamification, clock, 240, 10, 180);
    }

    @Test
    void cronometroNaoVoltaParaZeroAoLongoDaSessao() {
        SessionDto opened = service.start(USER);
        assertThat(opened.activeSeconds()).isZero();

        // 30s estudando, 20s fora da tela, 40s estudando, heartbeat, e de novo.
        tick(30);
        SessionDto paused = service.pause(USER);
        assertThat(paused.activeSeconds()).isEqualTo(30);

        tick(20);
        SessionDto resumed = service.resume(USER);
        assertThat(resumed.activeSeconds()).isEqualTo(30);
        assertThat(resumed.id()).isEqualTo(opened.id());

        tick(40);
        SessionDto beat = service.heartbeat(USER);
        assertThat(beat.activeSeconds()).isEqualTo(70);
        assertThat(beat.id()).isEqualTo(opened.id());

        tick(15);
        SessionDto pausedAgain = service.pause(USER);
        assertThat(pausedAgain.activeSeconds()).isEqualTo(85);

        tick(5);
        SessionDto back = service.resume(USER);
        assertThat(back.activeSeconds()).isEqualTo(85);
        assertThat(back.id()).isEqualTo(opened.id());

        // Uma sessão só o tempo todo: nada de recomeçar do zero.
        assertThat(store).hasSize(1);
    }

    @Test
    void alternarTelaVariasVezesNaoRecomecaOCronometro() {
        SessionDto opened = service.start(USER);

        long expected = 0;
        for (int i = 0; i < 20; i++) {
            tick(7);
            expected += 7;
            assertThat(service.pause(USER).activeSeconds()).isEqualTo(expected);
            tick(3);
            SessionDto back = service.resume(USER);
            assertThat(back.activeSeconds()).isEqualTo(expected);
            assertThat(back.id()).isEqualTo(opened.id());
        }
        assertThat(store).hasSize(1);
    }

    private void tick(long seconds) {
        now = now.plusSeconds(seconds);
    }

    /** Relógio que anda conforme o teste avança. */
    private class MovingClock extends Clock {
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}
