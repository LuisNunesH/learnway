package com.learnway.content.repository;

import com.learnway.content.entity.Subtopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubtopicRepository extends JpaRepository<Subtopic, UUID> {

    List<Subtopic> findByTopicIdOrderByOrderIndexAsc(UUID topicId);
}
