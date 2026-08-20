package com.learnway.content.dto;

import com.learnway.content.entity.Subtopic;

import java.util.UUID;

public record SubtopicDto(
        UUID id,
        UUID topicId,
        String slug,
        String title,
        String description,
        int orderIndex,
        UUID prerequisiteSubtopicId,
        long lessonCount
) {
    public static SubtopicDto from(Subtopic s, long lessonCount) {
        return new SubtopicDto(s.getId(), s.getTopic().getId(), s.getSlug(), s.getTitle(),
                s.getDescription(), s.getOrderIndex(), s.getPrerequisiteSubtopicId(), lessonCount);
    }
}
