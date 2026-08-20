package com.learnway.progress;

import com.learnway.progress.entity.LessonStatus;
import com.learnway.progress.entity.UserLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserLessonProgressRepository extends JpaRepository<UserLessonProgress, UUID> {

    Optional<UserLessonProgress> findByUserIdAndLessonId(UUID userId, UUID lessonId);

    List<UserLessonProgress> findByUserId(UUID userId);

    long countByUserIdAndStatus(UUID userId, LessonStatus status);
}
