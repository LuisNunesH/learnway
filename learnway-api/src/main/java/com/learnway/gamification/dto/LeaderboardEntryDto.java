package com.learnway.gamification.dto;

import java.util.UUID;

public record LeaderboardEntryDto(
        int rank,
        UUID userId,
        String username,
        String avatarUrl,
        long xpThisWeek,
        int level,
        boolean topOfWeek,
        boolean currentUser
) {
}
