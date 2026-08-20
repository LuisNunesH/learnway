package com.learnway.gamification.dto;

import com.learnway.gamification.entity.Achievement;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AchievementDto(
        UUID id,
        String slug,
        String title,
        String description,
        String icon,
        int xpBonus,
        boolean earned,
        OffsetDateTime earnedAt
) {
    public static AchievementDto locked(Achievement a) {
        return new AchievementDto(a.getId(), a.getSlug(), a.getTitle(), a.getDescription(),
                a.getIcon(), a.getXpBonus(), false, null);
    }

    public static AchievementDto earned(Achievement a, OffsetDateTime earnedAt) {
        return new AchievementDto(a.getId(), a.getSlug(), a.getTitle(), a.getDescription(),
                a.getIcon(), a.getXpBonus(), true, earnedAt);
    }
}
