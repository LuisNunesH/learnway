package com.learnway.session.dto;

import com.learnway.session.StudySession;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SessionDto(
        UUID id,
        OffsetDateTime startedAt,
        OffsetDateTime endedAt,
        Integer durationMinutes
) {
    public static SessionDto from(StudySession s) {
        return new SessionDto(s.getId(), s.getStartedAt(), s.getEndedAt(), s.getDurationMinutes());
    }
}
