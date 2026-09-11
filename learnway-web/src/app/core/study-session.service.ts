import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { API_URL } from './api.config';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { StudySession } from './models';
import { PresenceService } from './presence.service';

/** Sinal de vida enviado ao servidor enquanto a aba está visível. */
const HEARTBEAT_MS = 60_000;
/**
 * Sem interação por este tempo (já contado só na tela), ninguém está
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
 * a interação cessa, congelando o relógio. Assim uma aba esquecida aberta não
 * vira "estudo", e uma fechada sem o pagehide chegar ao servidor não volta no
 * dia seguinte marcando 60h.
 *
 * Sair da tela (outra aba, janela sem foco) pausa a contagem dos dois lados:
 * o cliente para de somar via {@link PresenceService} e avisa o servidor, que
 * desconta o intervalo da duração creditada. Ao voltar, o cronômetro segue de
 * onde parou — o tempo fora simplesmente não existiu.
 */
@Injectable({ providedIn: 'root' })
export class StudySessionService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private presence = inject(PresenceService);

  /** Quantas telas de estudo estão abertas; a sessão vive enquanto houver ≥ 1. */
  private holders = 0;
  /** Sessão que o cronômetro está exibindo; muda quando o servidor abre outra. */
  private sessionId: string | null = null;
  /** Segundos que o servidor já credita à sessão, na última resposta dele. */
  private syncedSeconds = 0;
  /** Leitura do relógio de presença no instante desse sync. */
  private syncedAtActiveMs = 0;
  /** Última interação, medida em tempo de tela (ver PresenceService.activeMs). */
  private lastInteractionActiveMs = 0;
  private tick: ReturnType<typeof setInterval> | null = null;
  private beat: ReturnType<typeof setInterval> | null = null;
  /** Fila serial: sair de uma lição tem de chegar ao servidor antes de entrar na próxima. */
  private queue: Promise<unknown> = Promise.resolve();
  private readonly elapsedSeconds = signal(0);

  readonly active = signal(false);
  /** Cronômetro congelado porque o usuário saiu da tela. */
  readonly paused = signal(false);
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
    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, () => (this.lastInteractionActiveMs = this.presence.activeMs()), {
        passive: true,
      });
    }
    this.presence.watch(onScreen => this.onPresenceChange(onScreen));
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
      this.active.set(true);
      this.lastInteractionActiveMs = this.presence.activeMs();
      this.adopt(session);
      this.tick = setInterval(() => this.updateElapsed(), 1000);
      this.beat = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    } catch {
      // sem sessão o app continua funcionando; o timer apenas não aparece
    }
  }

  private heartbeat(): void {
    if (!this.active() || !this.presence.onScreen() || this.idle()) return;
    void this.enqueue(() => this.beatOnce());
  }

  private idle(): boolean {
    return this.presence.activeMs() - this.lastInteractionActiveMs > IDLE_LIMIT_MS;
  }

  private async beatOnce(): Promise<void> {
    if (!this.active()) return;
    try {
      // O servidor pode ter aberto uma sessão nova (a anterior expirou):
      // acompanha a contagem dele para não exibir tempo que ninguém creditou.
      this.adopt(await firstValueFrom(this.api.heartbeatSession()));
    } catch {
      /* uma falha isolada não derruba o cronômetro */
    }
  }

  /**
   * Saiu da tela: congela o relógio aqui e avisa o servidor, que passa a
   * descontar o intervalo. Voltou: retoma de onde parou (ou de uma sessão
   * nova, se o servidor tiver desistido de esperar).
   */
  private onPresenceChange(onScreen: boolean): void {
    if (!this.active() && this.holders === 0) return;

    if (!onScreen) {
      this.updateElapsed();
      this.paused.set(true);
      void this.enqueue(() => this.syncWith(this.api.pauseSession()));
      return;
    }

    this.lastInteractionActiveMs = this.presence.activeMs(); // voltar já é sinal de vida
    void this.enqueue(async () => {
      await this.syncWith(this.api.resumeSession());
      this.paused.set(false);
    });
  }

  private async syncWith(call: Observable<StudySession>): Promise<void> {
    if (!this.active()) return;
    try {
      this.adopt(await firstValueFrom(call));
    } catch {
      /* o cronômetro local já está pausado; o servidor se acerta no próximo sinal */
    }
  }

  /**
   * Adota a contagem do servidor como base e volta a somar a partir dela.
   *
   * Dentro da mesma sessão o relógio só anda para frente: uma resposta que
   * venha atrasada, sem `activeSeconds` (servidor antigo) ou com menos tempo
   * do que já está na tela não pode zerar o mostrador — a cada heartbeat o
   * cronômetro voltaria para 00:00:00. Recomeçar do zero é privilégio de uma
   * sessão nova, e essa se identifica pelo id diferente.
   */
  private adopt(session: { id: string; activeSeconds?: number }): void {
    const restarted = session.id !== this.sessionId;
    this.sessionId = session.id;
    const fromServer = session.activeSeconds ?? 0;
    this.syncedSeconds = restarted ? fromServer : Math.max(fromServer, this.elapsedSeconds());
    this.syncedAtActiveMs = this.presence.activeMs();
    this.updateElapsed();
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
    this.paused.set(false);
    this.sessionId = null;
    this.syncedSeconds = 0;
    this.syncedAtActiveMs = 0;
    this.elapsedSeconds.set(0);
  }

  private updateElapsed(): void {
    if (!this.active()) return;
    // Mostra só o que o servidor creditaria: o tempo fora da tela não entra
    // (activeMs não anda lá), o relógio para junto com o heartbeat
    // (ociosidade) e nunca passa do teto de uma sessão.
    const until = Math.min(this.presence.activeMs(), this.lastInteractionActiveMs + IDLE_LIMIT_MS);
    const sinceSync = Math.max(0, until - this.syncedAtActiveMs);
    const elapsed = Math.min(this.syncedSeconds * 1000 + sinceSync, MAX_SESSION_MS);
    this.elapsedSeconds.set(Math.max(0, Math.floor(elapsed / 1000)));
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
