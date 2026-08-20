package com.learnway.content.dto;

import com.learnway.content.entity.Topic;

import java.util.UUID;

public record TopicDto(
        UUID id,
        String slug,
        String title,
        String description,
        String icon,
        String colorHex,
        int orderIndex
) {
    public static TopicDto from(Topic t) {
        return new TopicDto(t.getId(), t.getSlug(), t.getTitle(), t.getDescription(),
                t.getIcon(), t.getColorHex(), t.getOrderIndex());
    }
}
