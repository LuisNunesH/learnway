package com.learnway.content.repository;

import com.learnway.content.entity.DescriptiveAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DescriptiveAnswerRepository extends JpaRepository<DescriptiveAnswer, UUID> {

    Optional<DescriptiveAnswer> findByQuestionId(UUID questionId);
}
