package com.learnway.session.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * @param activeSessionSeconds tempo real já acumulado na sessão em curso —
 *                             sem o que se passou fora da tela, por isso não
 *                             dá para derivá-lo do {@code activeSessionStartedAt}.
 */
public record SessionStatsDto(
        long totalMinutes,
        long weekMinutes,
        long todayMinutes,
        int dailyGoalMinutes,
        OffsetDateTime activeSessionStartedAt,
        long activeSessionSeconds,
        List<DailyMinutes> weekly
) {
    public record DailyMinutes(LocalDate date, long minutes) {}
}
