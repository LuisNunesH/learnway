package com.learnway.gamification.repository;

import com.learnway.gamification.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievement.Key> {

    List<UserAchievement> findByUserId(UUID userId);

    boolean existsByUserIdAndAchievementId(UUID userId, UUID achievementId);

    long countByUserId(UUID userId);
}
