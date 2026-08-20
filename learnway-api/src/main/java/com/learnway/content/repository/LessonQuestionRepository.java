package com.learnway.content.repository;

import com.learnway.content.entity.LessonQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LessonQuestionRepository extends JpaRepository<LessonQuestion, UUID> {

    List<LessonQuestion> findByLessonIdOrderByOrderIndexAsc(UUID lessonId);

    long countByLessonId(UUID lessonId);
}
