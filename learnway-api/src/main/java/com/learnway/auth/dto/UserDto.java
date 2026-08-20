package com.learnway.auth.dto;

import com.learnway.auth.User;
import com.learnway.common.LevelCalculator;

import java.time.LocalDate;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String username,
        String role,
        String avatarUrl,
        int xpTotal,
        int level,
        int xpIntoLevel,
        int xpForNextLevel,
        int streakDays,
        int dailyGoalMinutes,
        LocalDate lastActivityDate
) {
    public static UserDto from(User user) {
        int level = LevelCalculator.levelFor(user.getXpTotal());
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole().name(),
                user.getAvatarUrl(),
                user.getXpTotal(),
                level,
                LevelCalculator.xpIntoLevel(user.getXpTotal()),
                LevelCalculator.xpToReachLevel(level + 1) - LevelCalculator.xpToReachLevel(level),
                user.getStreakDays(),
                user.getDailyGoalMinutes(),
                user.getLastActivityDate()
        );
    }
}
