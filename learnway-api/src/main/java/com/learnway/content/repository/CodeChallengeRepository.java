package com.learnway.content.repository;

import com.learnway.content.entity.CodeChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CodeChallengeRepository extends JpaRepository<CodeChallenge, UUID> {

    Optional<CodeChallenge> findByQuestionId(UUID questionId);
}
