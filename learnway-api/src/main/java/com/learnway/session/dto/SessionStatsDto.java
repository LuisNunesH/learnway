package com.learnway.session.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record SessionStatsDto(
        long totalMinutes,
        long weekMinutes,
        long todayMinutes,
        int dailyGoalMinutes,
        OffsetDateTime activeSessionStartedAt,
        List<DailyMinutes> weekly
) {
    public record DailyMinutes(LocalDate date, long minutes) {}
}
