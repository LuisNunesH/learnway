package com.learnway.content.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "subtopics")
@Getter
@Setter
@NoArgsConstructor
public class Subtopic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    /** Self-referencing prerequisite stored as a plain id to avoid eager recursion. */
    @Column(name = "prerequisite_subtopic_id", columnDefinition = "uuid")
    private UUID prerequisiteSubtopicId;
}
