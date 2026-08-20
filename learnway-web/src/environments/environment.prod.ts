/**
 * Ambiente de PRODUÇÃO — usado pelo `ng build` via `fileReplacements`.
 *
 * ⚠️ TROQUE A URL ABAIXO depois do primeiro deploy do backend.
 *
 * A URL do Cloud Run só existe depois que o serviço sobe pela primeira vez.
 * Para descobri-la:
 *
 *   gcloud run services describe learnway-api \
 *     --region southamerica-east1 --format='value(status.url)'
 *
 * O formato é https://learnway-api-<hash>-rj.a.run.app e é ESTÁVEL para o
 * mesmo serviço/projeto/região — troca uma vez e não mexe mais.
 *
 * Isto não é segredo: é uma URL pública, pode ficar versionada à vontade.
 * E lembre de manter em sincronia com as variáveis do backend:
 *   CORS_ALLOWED_ORIGINS  → a origem DESTE site
 *   OAUTH_FRONTEND_REDIRECT → <origem deste site>/oauth/callback
 */
export const environment = {
  production: true,
  apiOrigin: 'https://SUBSTITUA-PELA-URL-DO-CLOUD-RUN',
};
