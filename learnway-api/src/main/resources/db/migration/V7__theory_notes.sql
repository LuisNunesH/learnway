-- =====================================================================
-- LearnWay — Anotações pessoais nos assuntos da página de Teoria
-- Uma anotação por usuário+assunto. O assunto é o slug do artigo, que
-- vive no frontend (theory.content.ts) — por isso não há FK para ele.
-- =====================================================================

CREATE TABLE theory_notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id VARCHAR(80) NOT NULL,
    content    VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, article_id)
);
