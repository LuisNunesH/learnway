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

    public SessionService(StudySessionRepository sessionRepository,
                          UserRepository userRepository,
                          GamificationService gamificationService,
                          AppClock clock,
                          @Value("${learnway.session.max-minutes:240}") long maxMinutes,
                          @Value("${learnway.session.idle-timeout-minutes:10}") long idleTimeoutMinutes) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.gamificationService = gamificationService;
        this.clock = clock;
        this.maxSession = Duration.ofMinutes(maxMinutes);
        this.idleTimeout = Duration.ofMinutes(idleTimeoutMinutes);
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

    /** Encerra a sessão aberta e credita a duração (limitada ao teto). */
    @Transactional
    public SessionDto end(UUID userId) {
        OffsetDateTime now = clock.now();
        Optional<StudySession> open = sessionRepository
                .findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId);

        if (open.isEmpty()) {
            // A sessão já pode ter sido encerrada por inatividade (ou por outra
            // aba). Encerrar é idempotente: devolve a última em vez de estourar.
            return sessionRepository.findFirstByUserIdOrderByStartedAtDesc(userId)
                    .map(SessionDto::from)
                    .orElseThrow(() -> new ResourceNotFoundException("Nenhuma sessão de estudo aberta"));
        }

        StudySession session = finish(open.get(), now);
        if (sessionRepository.totalMinutes(userId) >= TEN_HOURS_IN_MINUTES) {
            gamificationService.grantIfAbsent(userId, "10h_study");
        }
        return SessionDto.from(session);
    }

    @Transactional
    public SessionStatsDto stats(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        OffsetDateTime now = clock.now();
        // Uma sessão abandonada não pode continuar contando como "ativa".
        sessionRepository.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
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

        OffsetDateTime activeStart = sessionRepository
                .findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .map(StudySession::getStartedAt)
                .orElse(null);

        return new SessionStatsDto(total, week, todayMin, user.getDailyGoalMinutes(), activeStart, weekly);
    }

    /** Retoma a sessão viva do usuário ou abre uma nova, fechando a que expirou. */
    private SessionDto openOrResume(UUID userId) {
        OffsetDateTime now = clock.now();
        StudySession open = sessionRepository
                .findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .orElse(null);

        if (open != null && isStale(open, now)) {
            finish(open, now);
            open = null;
        }

        if (open == null) {
            open = sessionRepository.save(new StudySession(userId, now, clock.dateOf(now)));
        } else {
            open.setLastSeenAt(now);
            sessionRepository.save(open);
        }
        return SessionDto.from(open);
    }

    /** Sessão sem sinal de vida recente, ou que já passou do tempo máximo. */
    private boolean isStale(StudySession session, OffsetDateTime now) {
        return Duration.between(session.lastSeenOrStart(), now).compareTo(idleTimeout) > 0
                || Duration.between(session.getStartedAt(), now).compareTo(maxSession) > 0;
    }

    /**
     * Fecha a sessão creditando apenas tempo defensável: até o último sinal
     * de vida (se o cliente sumiu) e nunca além do teto de uma sessão.
     */
    private StudySession finish(StudySession session, OffsetDateTime now) {
        OffsetDateTime lastSeen = session.lastSeenOrStart();
        OffsetDateTime end = Duration.between(lastSeen, now).compareTo(idleTimeout) > 0 ? lastSeen : now;

        OffsetDateTime cap = session.getStartedAt().plus(maxSession);
        if (end.isAfter(cap)) end = cap;
        if (end.isBefore(session.getStartedAt())) end = session.getStartedAt();

        session.setEndedAt(end);
        session.setLastSeenAt(end);
        session.setDurationMinutes((int) Duration.between(session.getStartedAt(), end).toMinutes());
        return sessionRepository.save(session);
    }
}
