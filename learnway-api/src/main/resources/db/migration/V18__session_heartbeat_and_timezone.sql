-- ─── SESSÕES DE ESTUDO: heartbeat + saneamento ───────────────────────
-- Problema: /sessions/start era idempotente e devolvia a sessão aberta
-- qualquer que fosse a idade dela. Quem fechava a aba sem o /sessions/end
-- chegar ao servidor (crash, offline, mobile) deixava a sessão aberta para
-- sempre — e no dia seguinte o cronômetro voltava marcando 60h, gravando
-- durações absurdas ao encerrar.
--
-- last_seen_at guarda o último sinal de vida do cliente (heartbeat), para
-- que uma sessão abandonada seja fechada onde o usuário realmente parou.
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

UPDATE study_sessions
   SET last_seen_at = COALESCE(ended_at, started_at)
 WHERE last_seen_at IS NULL;

-- Sessões abertas há mais de 12h nunca foram encerradas de verdade: fecha
-- sem creditar tempo (a duração real é desconhecida). As recentes ficam
-- abertas — o próprio serviço as encerra pelo last_seen_at.
UPDATE study_sessions
   SET ended_at = started_at,
       duration_minutes = 0
 WHERE ended_at IS NULL
   AND started_at < NOW() - INTERVAL '12 hours';

-- Durações impossíveis já gravadas (as tais "60h") viram o teto de 4h.
UPDATE study_sessions
   SET duration_minutes = 240
 WHERE duration_minutes > 240;

UPDATE study_sessions
   SET duration_minutes = 0
 WHERE duration_minutes < 0;

-- ─── DIA CIVIL EM HORÁRIO DE BRASÍLIA ────────────────────────────────
-- session_date e event_date eram derivados em UTC: um acesso às 21h de
-- Brasília (00h UTC) era registrado no dia seguinte.
UPDATE study_sessions
   SET session_date = (started_at AT TIME ZONE 'America/Sao_Paulo')::date
 WHERE session_date IS DISTINCT FROM (started_at AT TIME ZONE 'America/Sao_Paulo')::date;

-- Reescreve as datas de login; o UNIQUE (user_id, event_date) exige apagar
-- antes as colisões que o deslocamento de fuso cria (mantém a mais antiga).
DELETE FROM login_events e
 USING login_events keep
 WHERE e.user_id = keep.user_id
   AND (e.created_at AT TIME ZONE 'America/Sao_Paulo')::date
     = (keep.created_at AT TIME ZONE 'America/Sao_Paulo')::date
   AND (e.created_at > keep.created_at
        OR (e.created_at = keep.created_at AND e.id > keep.id));

-- Em dois passos: o UNIQUE é verificado linha a linha, e recuar todas as
-- datas de uma vez colidiria no meio do caminho. Estaciona lá no ano 3900 e
-- só então traz cada linha para a data definitiva.
UPDATE login_events
   SET event_date = ((created_at AT TIME ZONE 'America/Sao_Paulo')::date + 700000)
 WHERE event_date IS DISTINCT FROM (created_at AT TIME ZONE 'America/Sao_Paulo')::date;

UPDATE login_events
   SET event_date = event_date - 700000
 WHERE event_date > DATE '3000-01-01';

-- Busca da sessão aberta do usuário (feita a cada start/heartbeat).
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_open
    ON study_sessions (user_id, started_at DESC)
 WHERE ended_at IS NULL;
