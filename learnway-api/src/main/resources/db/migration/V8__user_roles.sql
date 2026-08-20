-- ─── USER ROLES ──────────────────────────────────────────────────────
-- Papel de acesso: USER (padrão) ou ADMIN.

ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Conta administradora da plataforma.
UPDATE users SET role = 'ADMIN' WHERE email = 'luizenrique.0317@gmail.com';
