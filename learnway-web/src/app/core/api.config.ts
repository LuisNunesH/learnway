import { environment } from '../../environments/environment';

/**
 * Origem do backend (Spring Boot).
 *
 * O valor vem do arquivo de ambiente: localhost no `ng serve`, URL do Cloud Run
 * no build de produção (a troca é feita por `fileReplacements` no angular.json).
 */
export const API_ORIGIN = environment.apiOrigin;

/** URL base da learnway-api. */
export const API_URL = `${API_ORIGIN}/api`;

/** Endpoints do Spring Security que iniciam o login social. */
export const OAUTH_GOOGLE_URL = `${API_ORIGIN}/oauth2/authorization/google`;
export const OAUTH_GITHUB_URL = `${API_ORIGIN}/oauth2/authorization/github`;
