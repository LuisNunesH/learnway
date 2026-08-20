package com.learnway.content.repository;

import com.learnway.content.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {

    List<Topic> findAllByActiveTrueOrderByOrderIndexAsc();

    Optional<Topic> findBySlug(String slug);
}
