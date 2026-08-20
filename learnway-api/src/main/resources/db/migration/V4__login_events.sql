-- ─── LOGIN EVENTS (calendário de atividade: "o usuário entrou neste dia?") ───
-- Um registro por usuário por dia; gravado no login (local ou social) e na
-- primeira visita autenticada do dia (usuários que voltam com token salvo).
CREATE TABLE login_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_date  DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_date)
);
