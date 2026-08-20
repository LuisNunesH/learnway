/**
 * Ambiente de DESENVOLVIMENTO (`ng serve`).
 *
 * O build de produção troca este arquivo pelo environment.prod.ts — ver
 * `fileReplacements` em angular.json. Não importe environment.prod.ts direto
 * em lugar nenhum: sempre importe daqui.
 */
export const environment = {
  production: false,
  /** Backend Spring Boot rodando na sua máquina. */
  apiOrigin: 'http://localhost:8080',
};
