package com.learnway.note.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Anotação pessoal de um usuário sobre um assunto da página de teoria.
 * O assunto é identificado pelo slug do artigo (definido no frontend),
 * e cada usuário tem no máximo uma anotação por assunto.
 */
@Entity
@Table(name = "theory_notes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "article_id"}))
@Getter
@Setter
@NoArgsConstructor
public class TheoryNote {

    public static final int MAX_CONTENT_LENGTH = 2000;
    public static final int MAX_ARTICLE_ID_LENGTH = 80;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "article_id", nullable = false, length = MAX_ARTICLE_ID_LENGTH)
    private String articleId;

    @Column(nullable = false, length = MAX_CONTENT_LENGTH)
    private String content;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public TheoryNote(UUID userId, String articleId) {
        this.userId = userId;
        this.articleId = articleId;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }
}
