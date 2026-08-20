-- =====================================================================
-- LearnWay — suporte a login social (Google / GitHub)
--   * contas sociais não possuem senha → password_hash vira opcional
--   * auth_provider registra a origem da conta (LOCAL | GOOGLE | GITHUB)
-- =====================================================================

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
