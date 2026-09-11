/**
 * Ambiente de PRODUÇÃO — usado pelo `ng build` via `fileReplacements`.
 *
 * ⚠️ TROQUE `apiOrigin` PELO SEU DOMÍNIO depois de subir o backend (Parte 3 do
 * DEPLOY.md). Enquanto estiver com o valor abaixo, o site publicado carrega,
 * mostra a tela de login e falha em toda chamada de API.
 *
 * Precisa ser HTTPS e um DOMÍNIO, não um IP:
 *   - a página no Cloudflare Pages é servida por HTTPS, e um site HTTPS não
 *     pode chamar uma API por HTTP (o navegador bloqueia como mixed content);
 *   - o Let's Encrypt não emite certificado para endereço IP.
 * Se você seguiu o runbook, isto vira algo como:
 *
 *   apiOrigin: 'https://learnway-api.duckdns.org',
 *
 * Sem barra no final: o ApiService concatena '/api/...' direto.
 *
 * Isto não é segredo — é uma URL pública, pode ficar versionada à vontade.
 * O que PRECISA acompanhar, no `api.env` da VM (Parte 6.3 do DEPLOY.md):
 *   CORS_ALLOWED_ORIGINS    → a origem DESTE site (ex.: https://learnway.pages.dev)
 *   OAUTH_FRONTEND_REDIRECT → <origem deste site>/oauth/callback
 * Se qualquer um dos dois não bater exatamente, o navegador barra tudo por CORS.
 */
export const environment = {
  production: true,
  apiOrigin: 'https://learnway-api.duckdns.org',
};
