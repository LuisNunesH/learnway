package com.learnway.activity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "login_events")
@Getter
@Setter
@NoArgsConstructor
public class LoginEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public LoginEvent(UUID userId, LocalDate eventDate) {
        this.userId = userId;
        this.eventDate = eventDate;
        this.createdAt = OffsetDateTime.now(ZoneOffset.UTC);
    }
}
