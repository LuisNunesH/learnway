import { Injectable, signal } from '@angular/core';

/**
 * Presença do usuário na tela — a fonte única de "ele está aqui agora?".
 *
 * Estar na tela é a aba visível *e* a janela com foco: trocar de aba,
 * minimizar o navegador ou alt-tab para outro programa contam igual como
 * sair. Quem cronometra qualquer coisa (o timer de estudo da navbar, o tempo
 * por questão da lição) mede em {@link activeMs}, um relógio que só anda
 * enquanto o usuário está na tela — assim o tempo fora nunca vira estudo, e
 * ao voltar a contagem continua de onde parou em vez de recomeçar.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  /** O usuário está com a tela do LearnWay à frente? */
  readonly onScreen = signal(true);

  private readonly bootMs = Date.now();
  /** Tempo já acumulado fora da tela, em ms. */
  private awayMs = 0;
  /** Início da ausência em curso; null enquanto ele está na tela. */
  private awaySinceMs: number | null = null;
  private readonly watchers = new Set<(onScreen: boolean) => void>();

  constructor() {
    document.addEventListener('visibilitychange', () => this.sync());
    window.addEventListener('focus', () => this.sync());
    window.addEventListener('blur', () => this.sync());
    window.addEventListener('pageshow', () => this.sync());
    this.sync();
  }

  /**
   * Avisa a cada entrada/saída de tela. Sem cancelamento: quem observa são
   * serviços raiz, que vivem tanto quanto a página.
   */
  watch(listener: (onScreen: boolean) => void): void {
    this.watchers.add(listener);
  }

  /**
   * Relógio de presença: ms desde a abertura da página, descontado tudo o
   * que se passou fora da tela. Cronometrar é guardar este valor no início e
   * subtrair depois — a diferença já exclui as ausências.
   */
  activeMs(): number {
    const away = this.awayMs + (this.awaySinceMs === null ? 0 : Date.now() - this.awaySinceMs);
    return Date.now() - this.bootMs - away;
  }

  private sync(): void {
    const onScreen = document.visibilityState === 'visible' && document.hasFocus();
    if (onScreen === this.onScreen()) return;

    if (onScreen) {
      // Fecha a ausência: o intervalo inteiro sai da conta de todo mundo.
      if (this.awaySinceMs !== null) this.awayMs += Date.now() - this.awaySinceMs;
      this.awaySinceMs = null;
    } else {
      this.awaySinceMs = Date.now();
    }
    this.onScreen.set(onScreen);
    for (const watcher of this.watchers) watcher(onScreen);
  }
}
