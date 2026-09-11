package com.learnway.session.dto;

import com.learnway.session.StudySession;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * @param activeSeconds tempo de estudo real já acumulado (sem o que se passou
 *                      fora da tela) — é daqui que o cronômetro do cliente
 *                      parte, em vez de contar do {@code startedAt}.
 * @param paused        o usuário está fora da tela agora.
 */
public record SessionDto(
        UUID id,
        OffsetDateTime startedAt,
        OffsetDateTime endedAt,
        Integer durationMinutes,
        long activeSeconds,
        boolean paused
) {
    public static SessionDto from(StudySession s, OffsetDateTime now) {
        OffsetDateTime until = s.getEndedAt() == null ? now : s.getEndedAt();
        return new SessionDto(s.getId(), s.getStartedAt(), s.getEndedAt(), s.getDurationMinutes(),
                s.activeSecondsAt(until), s.isPaused());
    }
}
