package com.learnway.session;

import com.learnway.auth.User;
import com.learnway.auth.UserRepository;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.common.time.AppClock;
import com.learnway.gamification.GamificationService;
import com.learnway.session.dto.SessionDto;
import com.learnway.session.dto.SessionStatsDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Cronômetro de estudo.
 *
 * <p>O cliente abre a sessão ({@code start}), sinaliza vida a cada minuto
 * ({@code heartbeat}) e a encerra ao sair ({@code end}). Como o encerramento
 * é o passo que mais falha — aba fechada, queda de rede, celular bloqueado —
 * nenhuma conta depende dele: o tempo creditado nunca passa do último
 * heartbeat, e uma sessão parada por mais que o {@code idleTimeout} é
 * considerada abandonada e fechada retroativamente. É isso que impede o
 * cronômetro de reaparecer no dia seguinte marcando 60h.</p>
 *
 * <p>Tempo fora da tela não é estudo: quando o usuário troca de aba ou tira o
 * foco da janela, o cliente chama {@code pause}, e {@code resume} ao voltar.
 * O intervalo entre os dois vai para {@code awaySeconds} e é descontado da
 * duração — o cronômetro continua de onde parou em vez de recomeçar. Só a
 * pausa longa demais ({@code pauseGrace}) encerra a sessão, para que o tempo
 * não caia no dia civil errado do gráfico.</p>
 */
@Service
public class SessionService {

    private static final long TEN_HOURS_IN_MINUTES = 600;

    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;
    private final AppClock clock;
    private final Duration maxSession;
    private final Duration idleTimeout;
    private final Duration pauseGrace;

    public SessionService(StudySessionRepository sessionRepository,
                          UserRepository userRepository,
                          GamificationService gamificationService,
                          AppClock clock,
                          @Value("${learnway.session.max-minutes:240}") long maxMinutes,
                          @Value("${learnway.session.idle-timeout-minutes:10}") long idleTimeoutMinutes,
                          @Value("${learnway.session.pause-grace-minutes:180}") long pauseGraceMinutes) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.gamificationService = gamificationService;
        this.clock = clock;
        this.maxSession = Duration.ofMinutes(maxMinutes);
        this.idleTimeout = Duration.ofMinutes(idleTimeoutMinutes);
        this.pauseGrace = Duration.ofMinutes(pauseGraceMinutes);
    }

    /**
     * Abre uma sessão de estudo. Retoma a que já estava aberta se ela ainda
     * está viva (trocar de lição não zera o cronômetro); se estiver parada
     * ou longa demais, encerra a antiga e começa uma nova.
     */
    @Transactional
    public SessionDto start(UUID userId) {
        SessionDto session = openOrResume(userId);
        gamificationService.touchActivity(userId);
        return session;
    }

    /**
     * Sinal de vida do cliente, ~1x por minuto. Mantém a sessão viva e
     * marca até onde o tempo é real; sem heartbeat recente a sessão é
     * fechada no último sinal, não no instante em que o usuário voltar.
     */
    @Transactional
    public SessionDto heartbeat(UUID userId) {
        return openOrResume(userId);
    }

    /**
     * O usuário saiu da tela: congela o cronômetro. Daqui em diante o tempo
     * corre para {@code awaySeconds}, não para a duração. Idempotente — uma
     * segunda pausa não move o início da que já está em curso.
     */
    @Transactional
    public SessionDto pause(UUID userId) {
        OffsetDateTime now = clock.now();
        StudySession open = openSession(userId).orElse(null);

        if (open == null || isStale(open, now)) {
            if (open != null) finish(open, now);
            return lastSession(userId);
        }

        if (!open.isPaused()) {
            open.setPausedAt(now);
            open.setLastSeenAt(now);
            sessionRepository.save(open);
        }
        return SessionDto.from(open, now);
    }

    /** O usuário voltou para a tela: o cronômetro continua de onde parou. */
    @Transactional
    public SessionDto resume(UUID userId) {
        return openOrResume(userId);
    }

    /** Encerra a sessão aberta e credita a duração (limitada ao teto). */
    @Transactional
    public SessionDto end(UUID userId) {
        OffsetDateTime now = clock.now();
        Optional<StudySession> open = openSession(userId);

        if (open.isEmpty()) {
            // A sessão já pode ter sido encerrada por inatividade (ou por outra
            // aba). Encerrar é idempotente: devolve a última em vez de estourar.
            return lastSession(userId);
        }

        StudySession session = finish(open.get(), now);
        if (sessionRepository.totalMinutes(userId) >= TEN_HOURS_IN_MINUTES) {
            gamificationService.grantIfAbsent(userId, "10h_study");
        }
        return SessionDto.from(session, now);
    }

    @Transactional
    public SessionStatsDto stats(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        OffsetDateTime now = clock.now();
        // Uma sessão abandonada não pode continuar contando como "ativa".
        openSession(userId)
                .filter(s -> isStale(s, now))
                .ifPresent(s -> finish(s, now));

        LocalDate today = clock.today();
        LocalDate weekStart = today.minusDays(6);

        long total = sessionRepository.totalMinutes(userId);
        long week = sessionRepository.minutesSince(userId, weekStart);
        long todayMin = sessionRepository.minutesSince(userId, today);

        List<SessionStatsDto.DailyMinutes> weekly = sessionRepository.dailyMinutesSince(userId, weekStart).stream()
                .map(r -> new SessionStatsDto.DailyMinutes(r.getDate(), r.getMinutes()))
                .toList();

        StudySession active = openSession(userId).orElse(null);

        return new SessionStatsDto(total, week, todayMin, user.getDailyGoalMinutes(),
                active == null ? null : active.getStartedAt(),
                active == null ? 0 : active.activeSecondsAt(now),
                weekly);
    }

    /**
     * Retoma a sessão viva do usuário ou abre uma nova, fechando a que expirou.
     * Chegar aqui já é prova de presença: uma sessão pausada volta a contar, e
     * o que ficou entre a pausa e agora vira tempo fora da tela.
     */
    private SessionDto openOrResume(UUID userId) {
        OffsetDateTime now = clock.now();
        StudySession open = openSession(userId).orElse(null);

        if (open != null && isStale(open, now)) {
            finish(open, now);
            open = null;
        }

        if (open == null) {
            open = sessionRepository.save(new StudySession(userId, now, clock.dateOf(now)));
        } else {
            if (open.isPaused()) {
                long away = Duration.between(open.getPausedAt(), now).toSeconds();
                open.setAwaySeconds(open.getAwaySeconds() + (int) Math.max(0, away));
                open.setPausedAt(null);
            }
            open.setLastSeenAt(now);
            sessionRepository.save(open);
        }
        return SessionDto.from(open, now);
    }

    private Optional<StudySession> openSession(UUID userId) {
        return sessionRepository.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId);
    }

    /** Última sessão do usuário, para respostas idempotentes. */
    private SessionDto lastSession(UUID userId) {
        OffsetDateTime now = clock.now();
        return sessionRepository.findFirstByUserIdOrderByStartedAtDesc(userId)
                .map(s -> SessionDto.from(s, now))
                .orElseThrow(() -> new ResourceNotFoundException("Nenhuma sessão de estudo aberta"));
    }

    /**
     * Sessão sem sinal de vida recente, ou que já passou do tempo máximo.
     * Pausada, ela tem uma folga bem maior — sair da tela é legítimo e não
     * credita tempo nenhum —, mas não infinita: um retorno no dia seguinte
     * lançaria o estudo na data errada do gráfico.
     */
    private boolean isStale(StudySession session, OffsetDateTime now) {
        Duration silence = Duration.between(session.lastSeenOrStart(), now);
        Duration limit = session.isPaused() ? pauseGrace : idleTimeout;
        return silence.compareTo(limit) > 0
                || session.activeSecondsAt(now) > maxSession.toSeconds()
                || !clock.dateOf(session.getStartedAt()).equals(clock.dateOf(now));
    }

    /**
     * Fecha a sessão creditando apenas tempo defensável: até o início da pausa
     * em curso (fora da tela não é estudo), até o último sinal de vida se o
     * cliente sumiu, e nunca além do teto de uma sessão.
     */
    private StudySession finish(StudySession session, OffsetDateTime now) {
        OffsetDateTime lastSeen = session.lastSeenOrStart();
        OffsetDateTime end;
        if (session.isPaused()) {
            end = session.getPausedAt();
        } else if (Duration.between(lastSeen, now).compareTo(idleTimeout) > 0) {
            end = lastSeen;
        } else {
            end = now;
        }
        if (end.isBefore(session.getStartedAt())) end = session.getStartedAt();

        long span = Duration.between(session.getStartedAt(), end).toSeconds();
        long away = Math.min(session.getAwaySeconds(), span);
        long active = span - away;
        if (active > maxSession.toSeconds()) {
            active = maxSession.toSeconds();
            end = session.getStartedAt().plusSeconds(away + active);
        }

        session.setPausedAt(null);
        session.setAwaySeconds((int) away);
        session.setEndedAt(end);
        session.setLastSeenAt(end);
        session.setDurationMinutes((int) (active / 60));
        return sessionRepository.save(session);
    }
}
