package com.learnway.profile.dto;

import com.learnway.auth.dto.UserDto;
import com.learnway.content.entity.QuestionType;
import com.learnway.gamification.dto.AchievementDto;

import java.time.LocalDate;
import java.util.List;

public record ProfileDto(
        UserDto user,
        long totalStudyMinutes,
        long lessonsCompleted,
        long achievementsEarned,
        List<AchievementDto> achievements,
        List<TypeAccuracy> accuracyByType,
        List<XpPoint> xpHistory,
        List<DayActivity> studyHeatmap,
        List<TopicDistribution> lessonsByTopic
) {
    public record TypeAccuracy(QuestionType type, long total, long correct, double accuracyPercent) {}

    public record XpPoint(LocalDate date, long xp) {}

    public record DayActivity(LocalDate date, long minutes) {}

    public record TopicDistribution(String topicTitle, String colorHex, long completed, long total) {}
}
