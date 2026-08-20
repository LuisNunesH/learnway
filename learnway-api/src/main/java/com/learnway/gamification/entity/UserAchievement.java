package com.learnway.gamification.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_achievements")
@IdClass(UserAchievement.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class UserAchievement {

    @Id
    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Id
    @Column(name = "achievement_id", columnDefinition = "uuid")
    private UUID achievementId;

    @Column(name = "earned_at", nullable = false)
    private OffsetDateTime earnedAt;

    public UserAchievement(UUID userId, UUID achievementId) {
        this.userId = userId;
        this.achievementId = achievementId;
        this.earnedAt = OffsetDateTime.now();
    }

    /** Composite primary key. */
    public static class Key implements Serializable {
        private UUID userId;
        private UUID achievementId;

        public Key() {}

        public Key(UUID userId, UUID achievementId) {
            this.userId = userId;
            this.achievementId = achievementId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return Objects.equals(userId, key.userId) && Objects.equals(achievementId, key.achievementId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, achievementId);
        }
    }
}
