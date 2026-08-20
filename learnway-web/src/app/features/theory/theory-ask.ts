import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect,
  effect, inject, input, output, signal, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ChatInput } from '../../shared/chat-input';
import { Icon } from '../../shared/icon';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { Spinner } from '../../shared/widgets';
import { TheoryChatSessionService } from './theory-chat-session.service';
import { TheoryArticle } from './theory.content';

const WIDTH_KEY = 'lw.theoryAskWidth';
const WIDTH_MIN = 340;
const WIDTH_MAX = 860;
const WIDTH_DEFAULT = 430;

/** Quantas falas anteriores acompanham a pergunta (o backend usa as mesmas 8). */
const HISTORY_LIMIT = 8;

/**
 * Painel lateral "Tirar dúvidas" — chat livre e multi-turno sobre o artigo de
 * teoria aberto. Diferente do validador, aqui quem pergunta é o aluno, sem
 * limite de perguntas e com a conversa anterior servindo de contexto.
 */
@Component({
  selector: 'lw-theory-ask',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatInput, FormsModule, Icon, MarkdownPipe, Spinner],
  template: `
    <div class="backdrop" (click)="close.emit()"></div>
    <aside class="drawer anim-pop" [style.width.px]="width()">
      <div class="drawer__resize" title="Arrastar para redimensionar"
           (pointerdown)="resizeStart($event)" (pointermove)="resizeMove($event)"
           (pointerup)="resizeEnd($event)" (pointercancel)="resizeEnd($event)"></div>
      <header class="drawer__head">
        <span class="drawer__title"><lw-icon name="bot" [size]="20" /> Tirar dúvidas</span>
        @if (messages().length > 0) {
          <button class="drawer__close" (click)="clear()" [disabled]="thinking()"
                  title="Limpar conversa" aria-label="Limpar conversa"><lw-icon name="trash" [size]="16" /></button>
        }
        <button class="drawer__close" (click)="close.emit()" aria-label="Fechar"><lw-icon name="x" [size]="18" /></button>
      </header>

      <div class="drawer__messages" #scroller>
        @if (messages().length === 0) {
          <div class="hint">
            <lw-icon name="sparkles" [size]="22" />
            <p>
              Pergunte o que quiser sobre "{{ article().title }}" — conceitos, exemplos,
              quando usar. A IA conhece o texto que você está lendo e lembra da conversa.
            </p>
            <div class="hint__seeds">
              @for (seed of SEEDS; track seed) {
                <button class="hint__seed" (click)="ask(seed)" [disabled]="thinking()">{{ seed }}</button>
              }
            </div>
          </div>
        }
        @for (msg of messages(); track $index) {
          <div class="bubble" [class.bubble--user]="msg.role === 'user'">
            @if (msg.role === 'ai') {
              <div class="md md--chat" [innerHTML]="msg.text | markdown"></div>
            } @else {
              {{ msg.text }}
            }
          </div>
        }
        @if (thinking()) {
          <div class="bubble bubble--thinking">
            <lw-spinner [size]="14" /> pensando…
            <button class="bubble__cancel" type="button" (click)="cancel()">cancelar</button>
          </div>
        }
      </div>

      <form class="drawer__input" (ngSubmit)="send()">
        <textarea class="input" name="question" [(ngModel)]="draft" lwChatInput (enterSubmit)="send()"
                  placeholder="Sua dúvida sobre este assunto…"
                  [disabled]="thinking()" maxlength="1000" autocomplete="off"
                  rows="1" title="Enter envia · Shift+Enter quebra a linha"></textarea>
        @if (thinking()) {
          <button class="btn btn--secondary" type="button" (click)="cancel()"
                  title="Cancelar envio" aria-label="Cancelar envio">
            <lw-icon name="x" [size]="16" />
          </button>
        } @else {
          <button class="btn btn--primary" type="submit"
                  [disabled]="draft.trim().length < 3"
                  aria-label="Enviar pergunta">
            <lw-icon name="send" [size]="16" />
          </button>
        }
      </form>
    </aside>
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; background: var(--lw-scrim); z-index: 90; }
    .drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      max-width: 100vw;
      z-index: 91;
      background: var(--lw-paper-raised);
      border-left: 1px solid var(--lw-rule);
      box-shadow: var(--lw-lift-lg);
      display: flex; flex-direction: column;
    }
    .drawer__resize {
      position: absolute;
      top: 0; bottom: 0; left: -4px;
      width: 9px;
      cursor: ew-resize;
      touch-action: none;
      z-index: 1;
      &:hover, &:active { background: var(--lw-accent-wash); }
    }
    .drawer__head {
      display: flex; align-items: center; gap: var(--lw-space-sm);
      padding: var(--lw-space-lg);
      border-bottom: 1px solid var(--lw-rule);
    }
    .drawer__title {
      display: flex; align-items: center; gap: 9px;
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-weight: 600; font-size: var(--lw-text-h3);
      color: var(--lw-ink);
      flex: 1;
      lw-icon { color: var(--lw-accent); }
    }
    .drawer__close {
      background: none; border: none; color: var(--lw-ink-faint);
      cursor: pointer; padding: 6px; border-radius: var(--lw-radius-sm); line-height: 0;
      &:hover:not(:disabled) { background: var(--lw-paper-sunken); color: var(--lw-ink); }
      &:disabled { opacity: 0.5; cursor: default; }
    }
    .drawer__messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--lw-space-lg);
      display: flex; flex-direction: column; gap: var(--lw-space-lg);
      scroll-behavior: smooth;
    }
    .hint {
      display: flex; flex-direction: column; align-items: center; gap: var(--lw-space-md);
      text-align: center;
      color: var(--lw-ink-muted);
      padding: var(--lw-space-2xl) var(--lw-space-lg);
      font-family: var(--lw-font-prose);
      font-size: var(--lw-text-body);
      line-height: 1.6;
      lw-icon { color: var(--lw-ink-faint); }
      p { margin: 0; }
    }
    /* Sugestões de partida: o aluno que não sabe o que perguntar começa por aqui. */
    .hint__seeds { display: flex; flex-direction: column; gap: var(--lw-space-sm); width: 100%; }
    .hint__seed {
      padding: 9px var(--lw-space-md);
      border: 1px solid var(--lw-rule);
      border-radius: var(--lw-radius);
      background: var(--lw-paper-sunken);
      color: var(--lw-ink-muted);
      font-family: inherit;
      font-size: 13.5px;
      text-align: left;
      cursor: pointer;
      transition: border-color var(--lw-dur-fast) var(--lw-ease), color var(--lw-dur-fast) var(--lw-ease);
      &:hover:not(:disabled) { border-color: var(--lw-accent); color: var(--lw-ink); }
      &:disabled { opacity: 0.5; cursor: default; }
    }

    /* Diálogo editorial: a IA fala na margem (sem balão), o aluno em papel. */
    .bubble {
      max-width: 94%;
      padding: 2px 0 2px var(--lw-space-md);
      border-left: 2px solid var(--lw-rule);
      font-size: var(--lw-text-sm);
      align-self: flex-start;
      overflow-wrap: break-word;
    }
    .bubble--user {
      align-self: flex-end;
      max-width: 88%;
      padding: 9px 13px;
      border-left: none;
      background: var(--lw-paper-sunken);
      border-radius: var(--lw-radius);
      /* O aluno pode quebrar linha com Shift+Enter — o balão preserva o recorte. */
      white-space: pre-wrap;
    }
    .bubble--thinking {
      display: flex; align-items: center; gap: 8px;
      color: var(--lw-ink-faint);
      font-family: var(--lw-font-mono); font-size: 11.5px;
      border-left-color: var(--lw-accent);
    }
    /* Desistir da pergunta ao lado do "pensando…", onde o olho já está. */
    .bubble__cancel {
      background: none; border: none; padding: 0;
      font-family: inherit; font-size: inherit;
      color: var(--lw-ink-muted);
      text-decoration: underline; text-underline-offset: 2px;
      cursor: pointer;
      &:hover { color: var(--lw-ink); }
    }
    .md--chat {
      font-family: var(--lw-font-prose);
      font-size: 15px; line-height: 1.65;
      :is(p, ul, ol):last-child { margin-bottom: 0; }
      h1, h2, h3 { margin: 1.2em 0 0.4em; }
      h2 { border-bottom: none; padding-bottom: 0; }
    }
    .drawer__input {
      display: flex; align-items: flex-end; gap: var(--lw-space-sm);
      padding: var(--lw-space-md) var(--lw-space-lg) calc(var(--lw-space-md) + env(safe-area-inset-bottom));
      border-top: 1px solid var(--lw-rule);
      /* Campo de uma linha que cresce com o texto (a diretiva ajusta a altura). */
      .input {
        flex: 1;
        min-height: 0; max-height: 168px;
        resize: none; overflow-y: auto;
        line-height: 1.5;
      }
      .btn { padding: 10px 14px; }
    }
  `],
})
export class TheoryAsk {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private session = inject(TheoryChatSessionService);

  readonly article = input.required<TheoryArticle>();
  readonly close = output<void>();

  // Histórico vive no serviço: fechar e reabrir o painel não apaga a conversa —
  // ela acaba ao trocar de artigo ou sair da página de teoria.
  readonly messages = this.session.askMessages;
  readonly thinking = signal(false);

  readonly width = signal(loadStoredWidth());

  readonly SEEDS = [
    'Explique isso de forma mais simples, com um exemplo.',
    'Onde isso é usado no dia a dia de um projeto?',
    'Quais são os erros mais comuns nesse assunto?',
  ];

  private readonly scroller = viewChild<ElementRef<HTMLDivElement>>('scroller');

  /** Requisição em voo, guardada para poder ser abortada. */
  private request: Subscription | null = null;
  /** Texto da pergunta em voo, devolvido ao campo se ela for cancelada. */
  private pending = '';

  draft = '';

  constructor() {
    effect(() => this.session.bind(this.article().id));

    // Conversa longa: a última fala precisa estar à vista sem rolagem manual.
    afterRenderEffect(() => {
      const turns = this.messages().length;
      const busy = this.thinking();
      const el = this.scroller()?.nativeElement;
      if (el && (turns > 0 || busy)) el.scrollTop = el.scrollHeight;
    });
  }

  /** Envia uma das sugestões de partida como se o aluno a tivesse digitado. */
  ask(question: string): void {
    if (this.thinking()) return;
    this.draft = question;
    this.send();
  }

  send(): void {
    const question = this.draft.trim();
    if (question.length < 3 || this.thinking()) return;
    this.draft = '';
    // O histórico enviado é o de ANTES desta pergunta — ela vai no campo próprio.
    const history = this.messages().slice(-HISTORY_LIMIT);
    this.messages.update(m => [...m, { role: 'user', text: question }]);
    this.pending = question;
    this.thinking.set(true);

    const a = this.article();
    this.request = this.api.askTheory(a.title, a.body, question, history).subscribe({
      next: res => {
        this.messages.update(m => [...m, { role: 'ai', text: res.answer }]);
        this.settle();
      },
      error: err => {
        this.undoSend();
        this.toast.apiError(err, 'A IA não respondeu. Tente novamente.');
      },
    });
  }

  /**
   * Desiste da pergunta em andamento: cancelar a inscrição aborta a requisição
   * HTTP, e o texto volta ao campo para ser corrigido antes de reenviar.
   */
  cancel(): void {
    if (!this.thinking()) return;
    this.request?.unsubscribe();
    this.undoSend();
  }

  clear(): void {
    if (this.thinking()) return;
    this.session.clearAsk();
  }

  /** Tira a pergunta do histórico e devolve o texto ao campo. */
  private undoSend(): void {
    this.messages.update(m => m.slice(0, -1));
    this.draft = this.pending;
    this.settle();
  }

  private settle(): void {
    this.request = null;
    this.pending = '';
    this.thinking.set(false);
  }

  resizeStart(ev: PointerEvent): void {
    ev.preventDefault();
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  }

  resizeMove(ev: PointerEvent): void {
    if (!(ev.currentTarget as HTMLElement).hasPointerCapture(ev.pointerId)) return;
    const max = Math.min(WIDTH_MAX, window.innerWidth);
    this.width.set(Math.round(Math.min(Math.max(window.innerWidth - ev.clientX, WIDTH_MIN), max)));
  }

  resizeEnd(ev: PointerEvent): void {
    (ev.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId);
    try {
      localStorage.setItem(WIDTH_KEY, String(this.width()));
    } catch { /* preferência de largura é opcional */ }
  }
}

function loadStoredWidth(): number {
  try {
    const stored = Number(localStorage.getItem(WIDTH_KEY));
    if (stored >= WIDTH_MIN && stored <= WIDTH_MAX) return stored;
  } catch { /* sem localStorage, usa o padrão */ }
  return WIDTH_DEFAULT;
}
