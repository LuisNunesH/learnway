package com.learnway.content.repository;

import com.learnway.content.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findBySubtopicIdOrderByOrderIndexAsc(UUID subtopicId);

    @Query("""
            select l from Lesson l
            join l.subtopic s
            where s.topic.id = :topicId
            order by s.orderIndex asc, l.orderIndex asc
            """)
    List<Lesson> findByTopicId(@Param("topicId") UUID topicId);

    long countBySubtopicId(UUID subtopicId);
}
