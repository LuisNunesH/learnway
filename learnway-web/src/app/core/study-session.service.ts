import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './api.config';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/** Sinal de vida enviado ao servidor enquanto a aba está visível. */
const HEARTBEAT_MS = 60_000;
/**
 * Sem interação (ou com a aba escondida) por este tempo, ninguém está
 * estudando. Espelha o learnway.session.idle-timeout-minutes do servidor,
 * que é quem decide até onde o tempo é creditado.
 */
const IDLE_LIMIT_MS = 10 * 60_000;
/** Eventos que provam que tem gente do outro lado. */
const INTERACTION_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll'] as const;
/** Teto do cronômetro, espelhando o do servidor (learnway.session.max-minutes). */
const MAX_SESSION_MS = 4 * 60 * 60_000;

/**
 * Timer de sessão de estudo — visível na navbar enquanto ativo.
 *
 * Conta apenas estudo real: as telas de lição, teoria, revisão e flashcards
 * chamam start() ao abrir e end() ao sair, em contagem de referências (trocar
 * de lição não reinicia o cronômetro). Enquanto a aba está visível um
 * heartbeat avisa o servidor de que o estudo continua — e ele para assim que
 * a aba some ou a interação cessa, congelando o relógio. Assim uma aba
 * esquecida aberta não vira "estudo", e uma fechada sem o pagehide chegar ao
 * servidor não volta no dia seguinte marcando 60h.
 */
@Injectable({ providedIn: 'root' })
export class StudySessionService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  /** Quantas telas de estudo estão abertas; a sessão vive enquanto houver ≥ 1. */
  private holders = 0;
  private startedAtMs: number | null = null;
  private hiddenSinceMs: number | null = null;
  private lastInteractionMs = Date.now();
  private tick: ReturnType<typeof setInterval> | null = null;
  private beat: ReturnType<typeof setInterval> | null = null;
  /** Fila serial: sair de uma lição tem de chegar ao servidor antes de entrar na próxima. */
  private queue: Promise<unknown> = Promise.resolve();
  private readonly elapsedSeconds = signal(0);

  readonly active = signal(false);
  readonly display = computed(() => {
    const total = this.elapsedSeconds();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  });

  constructor() {
    // Garante o encerramento da sessão quando a aba fecha/recarrega.
    window.addEventListener('pagehide', () => this.endWithBeacon());
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, () => (this.lastInteractionMs = Date.now()), { passive: true });
    }
  }

  /** Uma tela de estudo foi aberta. */
  async start(): Promise<void> {
    this.holders++;
    if (this.holders > 1) return;
    await this.enqueue(async () => {
      if (!this.active()) await this.open();
    });
  }

  /** Uma tela de estudo foi fechada; a sessão só termina quando a última sai. */
  async end(): Promise<void> {
    this.holders = Math.max(0, this.holders - 1);
    if (this.holders > 0) return;
    await this.enqueue(async () => {
      if (this.active()) await this.close();
    });
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async close(): Promise<void> {
    this.stopTimers();
    try {
      await firstValueFrom(this.api.endSession());
    } catch {
      /* melhor esforço — o servidor fecha a sessão sozinha por inatividade */
    }
  }

  private async open(): Promise<void> {
    try {
      const session = await firstValueFrom(this.api.startSession());
      this.startedAtMs = new Date(session.startedAt).getTime();
      this.hiddenSinceMs = null;
      this.active.set(true);
      this.updateElapsed();
      this.tick = setInterval(() => this.updateElapsed(), 1000);
      this.beat = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    } catch {
      // sem sessão o app continua funcionando; o timer apenas não aparece
    }
  }

  private heartbeat(): void {
    if (!this.active() || document.visibilityState !== 'visible' || this.idle()) return;
    void this.enqueue(() => this.beatOnce());
  }

  private idle(): boolean {
    return Date.now() - this.lastInteractionMs > IDLE_LIMIT_MS;
  }

  private async beatOnce(): Promise<void> {
    if (!this.active()) return;
    try {
      const session = await firstValueFrom(this.api.heartbeatSession());
      // O servidor pode ter aberto uma sessão nova (a anterior expirou):
      // acompanha o início dele para não exibir um tempo que ninguém creditou.
      this.startedAtMs = new Date(session.startedAt).getTime();
      this.updateElapsed();
    } catch {
      /* uma falha isolada não derruba o cronômetro */
    }
  }

  /**
   * Aba escondida congela o relógio; voltar depois do limite de ociosidade
   * fecha a sessão antiga e começa outra, do zero.
   */
  private onVisibilityChange(): void {
    if (!this.active() && this.holders === 0) return;

    if (document.visibilityState === 'hidden') {
      this.hiddenSinceMs = Date.now();
      return;
    }

    const awayMs = this.hiddenSinceMs === null ? 0 : Date.now() - this.hiddenSinceMs;
    this.hiddenSinceMs = null;
    this.lastInteractionMs = Date.now(); // voltar para a aba já é sinal de vida
    if (awayMs < IDLE_LIMIT_MS) {
      this.updateElapsed();
      return;
    }

    void this.restart();
  }

  private restart(): Promise<unknown> {
    return this.enqueue(async () => {
      if (this.active()) await this.close();
      if (this.holders > 0) await this.open();
    });
  }

  /** pagehide não espera Promises — usa fetch keepalive. */
  private endWithBeacon(): void {
    if (!this.active()) return;
    const token = this.auth.accessToken;
    if (!token) return;
    this.stopTimers();
    fetch(`${API_URL}/sessions/end`, {
      method: 'POST',
      keepalive: true,
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }

  private stopTimers(): void {
    if (this.tick) clearInterval(this.tick);
    if (this.beat) clearInterval(this.beat);
    this.tick = null;
    this.beat = null;
    this.active.set(false);
    this.startedAtMs = null;
    this.hiddenSinceMs = null;
    this.elapsedSeconds.set(0);
  }

  private updateElapsed(): void {
    if (this.startedAtMs === null) return;
    // Mostra só o que o servidor creditaria: o relógio para junto com o
    // heartbeat (ociosidade) e nunca passa do teto de uma sessão.
    const until = Math.min(Date.now(), this.lastInteractionMs + IDLE_LIMIT_MS);
    const elapsed = Math.min(until - this.startedAtMs, MAX_SESSION_MS);
    this.elapsedSeconds.set(Math.max(0, Math.floor(elapsed / 1000)));
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
