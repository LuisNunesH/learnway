package com.learnway.progress.dto;

import com.learnway.review.entity.UrgencyLevel;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * The Duolingo-style trail map with per-lesson node state for the current user.
 */
public record TrailDto(
        List<TopicNode> topics
) {
    public enum NodeStatus { LOCKED, AVAILABLE, COMPLETED, REVIEW }

    public record TopicNode(
            UUID id,
            String slug,
            String title,
            String icon,
            String colorHex,
            int orderIndex,
            long completedLessons,
            long totalLessons,
            List<SubtopicNode> subtopics
    ) {}

    public record SubtopicNode(
            UUID id,
            String slug,
            String title,
            int orderIndex,
            boolean locked,
            UUID prerequisiteSubtopicId,
            List<LessonNode> lessons
    ) {}

    public record LessonNode(
            UUID id,
            String title,
            int orderIndex,
            Short difficultyLevel,
            int xpReward,
            NodeStatus status,
            BigDecimal scorePercentage,
            UrgencyLevel crystalUrgency
    ) {}
}
