-- ─── CRONÔMETRO PAUSA FORA DA TELA ───────────────────────────────────
-- Até aqui a duração creditada era puro relógio de parede (ended_at -
-- started_at): quem trocava de aba, minimizava a janela ou ia almoçar
-- com a lição aberta continuava "estudando" no gráfico de tempo.
--
-- Agora o cliente avisa quando sai da tela (/sessions/pause) e quando
-- volta (/sessions/resume); away_seconds acumula esses intervalos e é
-- descontado da duração. paused_at guarda o início da pausa em curso —
-- é a partir dele que uma sessão pausada tempo demais é encerrada.
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS away_seconds INT NOT NULL DEFAULT 0;

-- Sessões antigas não têm tempo fora da tela conhecido: seguem valendo
-- pelo relógio de parede que já foi creditado.
UPDATE study_sessions SET away_seconds = 0 WHERE away_seconds IS NULL;
