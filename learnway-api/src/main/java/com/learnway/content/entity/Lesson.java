package com.learnway.content.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subtopic_id", nullable = false)
    private Subtopic subtopic;

    @Column(nullable = false)
    private String title;

    @Column(name = "theory_content", columnDefinition = "text", nullable = false)
    private String theoryContent;

    @Column(name = "xp_reward", nullable = false)
    private int xpReward = 10;

    @Column(name = "difficulty_level")
    private Short difficultyLevel;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "estimated_minutes", nullable = false)
    private int estimatedMinutes = 15;
}
