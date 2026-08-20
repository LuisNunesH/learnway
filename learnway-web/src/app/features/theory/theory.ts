import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TheoryNote } from '../../core/models';
import { StudySessionService } from '../../core/study-session.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { TheoryAsk } from './theory-ask';
import { TheoryChat } from './theory-chat';
import { TheoryChatSessionService } from './theory-chat-session.service';
import { THEORY_ARTICLES, TheoryArticle } from './theory.content';

/**
 * Página de conteúdo teórico: leitura pura, sem exercícios.
 * Coluna esquerda lista os assuntos; a direita mostra o artigo em markdown.
 * A anotação pessoal (uma por assunto, /api/theory-notes) vive num painel
 * flutuante acessível de qualquer ponto da leitura, com edição em markdown
 * e visualização renderizada (estilo Notion). Dois painéis de IA acompanham a
 * leitura: "Validar", onde o aluno afirma e recebe o veredito, e "Dúvidas",
 * um chat livre sobre o assunto do artigo aberto.
 */
@Component({
  selector: 'lw-theory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, MarkdownPipe, TheoryAsk, TheoryChat],
  template: `
    <div class="page page--theory">
      <header class="page-head">
        <span class="lw-label">Biblioteca</span>
        <h1 class="page-title">Teoria</h1>
        <p class="page-subtitle">
          Conteúdo teórico para ler com calma — os conceitos por trás do que você pratica na trilha.
        </p>
      </header>

      <div class="layout">
        <!-- ══ Sumário dos assuntos ═══════════════════════════════ -->
        <aside class="sidebar" aria-label="Assuntos">
          <span class="term-label sidebar__label">assuntos</span>
          <nav class="topics">
            @for (article of articles; track article.id) {
              <button
                class="topic"
                [class.topic--active]="article.id === selected().id"
                (click)="select(article)">
                <lw-icon [name]="article.icon" [size]="15" class="topic__icon" />
                <span class="topic__text">
                  <strong>{{ article.title }}</strong>
                  <span class="topic__meta">
                    {{ article.readingMinutes }} min
                    @if (notes()[article.id]) {
                      <span class="topic__note-flag" title="Você tem uma anotação neste assunto">
                        <lw-icon name="pen" [size]="11" />
                      </span>
                    }
                  </span>
                </span>
              </button>
            }
          </nav>
        </aside>

        <!-- ══ Artigo ═════════════════════════════════════════════ -->
        <article class="reader anim-fade-up">
          @if (selected(); as article) {
            <header class="reader__head">
              <span class="lw-label reader__kicker">
                <lw-icon [name]="article.icon" [size]="12" /> Artigo · {{ article.readingMinutes }} min de leitura
              </span>
              <h2 class="reader__title">{{ article.title }}</h2>
              <p class="reader__lede">{{ article.summary }}</p>
              <div class="reader__tags">
                @for (tag of article.tags; track tag) {
                  <span class="chip">{{ tag }}</span>
                }
              </div>
            </header>

            <div class="md reader__body" [innerHTML]="article.body | markdown"></div>
          }
        </article>
      </div>
    </div>

    <!-- ══ Botões flutuantes (sempre visíveis durante a leitura) ══ -->
    <div class="fabs">
      <button class="fab fab--secondary" (click)="openAsk()"
              title="Tirar dúvidas com IA" aria-label="Tirar dúvidas com IA">
        <lw-icon name="bot" [size]="20" />
        <span class="fab__label">Dúvidas</span>
      </button>
      <button class="fab fab--secondary" (click)="openChat()"
              title="Validar conhecimento com IA" aria-label="Validar conhecimento com IA">
        <lw-icon name="target" [size]="20" />
        <span class="fab__label">Validar</span>
      </button>
      <button class="fab" [class.fab--active]="notesOpen()" (click)="toggleNotes()"
              title="Minhas anotações" aria-label="Minhas anotações">
        <lw-icon name="pen" [size]="20" />
        <span class="fab__label">Anotações</span>
        @if (note()) {
          <span class="fab__dot" title="Você tem uma anotação neste assunto"></span>
        }
      </button>
    </div>

    <!-- ══ Painel flutuante de anotações ══════════════════════════ -->
    @if (notesOpen()) {
      <section class="notes anim-pop" aria-label="Minhas anotações">
        <header class="notes__head">
          <span class="notes__title">
            <lw-icon name="pen" [size]="15" /> Anotações — {{ selected().title }}
          </span>
          <button class="notes__close" (click)="notesOpen.set(false)" aria-label="Fechar anotações">
            <lw-icon name="x" [size]="16" />
          </button>
        </header>

        @if (editing()) {
          <!-- edição estilo Notion: escreve markdown, alterna para pré-visualizar -->
          <div class="notes__tabs" role="tablist">
            <button class="notes__tab" role="tab" [class.notes__tab--active]="!previewing()"
                    (click)="previewing.set(false)">Escrever</button>
            <button class="notes__tab" role="tab" [class.notes__tab--active]="previewing()"
                    (click)="previewing.set(true)" [disabled]="!draft.trim()">Visualizar</button>
            <span class="mono notes__count" [class.notes__count--warn]="draft.length >= NOTE_MAX - 100">
              {{ draft.length }}/{{ NOTE_MAX }}
            </span>
          </div>
          @if (previewing()) {
            <div class="notes__body md md--note" [innerHTML]="draft | markdown"></div>
          } @else {
            <textarea
              class="input notes__field"
              name="noteDraft"
              [(ngModel)]="draft"
              [maxlength]="NOTE_MAX"
              [disabled]="saving()"
              placeholder="Escreva em markdown: **negrito**, - listas, \`código\`…"></textarea>
          }
          <div class="notes__foot">
            <button class="btn btn--ghost btn--sm" (click)="cancelEdit()" [disabled]="saving()">Cancelar</button>
            <button class="btn btn--primary btn--sm" (click)="saveNote()"
                    [disabled]="saving() || !draft.trim()">
              {{ saving() ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
        } @else if (note(); as n) {
          <div class="notes__body md md--note" [innerHTML]="n.content | markdown"></div>
          <div class="notes__foot notes__foot--split">
            <span class="muted notes__stamp">Atualizada em {{ formatStamp(n.updatedAt) }}</span>
            <div class="notes__actions">
              @if (confirmingDelete()) {
                <span class="notes__confirm">Apagar?</span>
                <button class="btn btn--danger btn--sm" (click)="deleteNote()" [disabled]="deleting()">
                  {{ deleting() ? 'Apagando…' : 'Apagar' }}
                </button>
                <button class="btn btn--ghost btn--sm" (click)="confirmingDelete.set(false)" [disabled]="deleting()">
                  Cancelar
                </button>
              } @else {
                <button class="btn btn--ghost btn--sm" (click)="startEdit()">
                  <lw-icon name="pen" [size]="14" /> Editar
                </button>
                <button class="btn btn--ghost btn--sm notes__delete" (click)="confirmingDelete.set(true)">
                  <lw-icon name="trash" [size]="14" /> Apagar
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="notes__empty">
            <p class="muted">Nenhuma anotação neste assunto ainda. Anote os pontos que você quer lembrar depois — pode usar markdown.</p>
            <button class="btn btn--secondary btn--sm" (click)="startEdit()">
              <lw-icon name="pen" [size]="14" /> Adicionar anotação
            </button>
          </div>
        }
      </section>
    }

    <!-- ══ Chat validador de conhecimento ═════════════════════════ -->
    @if (chatOpen()) {
      <lw-theory-chat [article]="selected()" (close)="chatOpen.set(false)" />
    }

    <!-- ══ Chat de dúvidas sobre o assunto ════════════════════════ -->
    @if (askOpen()) {
      <lw-theory-ask [article]="selected()" (close)="askOpen.set(false)" />
    }
  `,
  styles: [`
    /* O respiro do rodapé sai da .page e entra no artigo. Assim o .layout —
       bloco de contenção do sumário grudado — chega até o fim da rolagem, e o
       sumário não desgruda nos últimos pixels da página. */
    .page--theory { padding-bottom: 0; }

    .layout {
      display: grid;
      grid-template-columns: 232px 1fr;
      gap: var(--lw-space-2xl);
      align-items: start;
    }

    /* ---- sumário: lista de leitura, não botões ----
       Fica grudado logo abaixo do cabeçalho e NUNCA sai da tela:
       - "align-self: start" impede que o item da grade estique com a linha
         (esticado, ele não teria folga para deslizar dentro da área);
       - "max-height" + "overflow-y" garantem que, se um dia a lista passar da
         altura da janela, os últimos assuntos continuem alcançáveis;
       - "z-index" deixa o sumário acima do artigo, que ganha contexto de
         empilhamento próprio por causa da animação de entrada. */
    .sidebar {
      position: sticky;
      top: calc(var(--lw-masthead-h) + var(--lw-space-xl));
      z-index: 5;
      align-self: start;
      max-height: calc(100vh - var(--lw-masthead-h) - var(--lw-space-2xl));
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      display: flex;
      flex-direction: column;
      gap: var(--lw-space-sm);
      padding-right: var(--lw-space-lg);
      border-right: 1px solid var(--lw-rule);
    }
    .sidebar__label { color: var(--lw-ink-faint); }
    .topics { display: flex; flex-direction: column; }
    .topic {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      width: 100%;
      padding: 9px 0 9px var(--lw-space-md);
      border: none;
      border-left: 2px solid transparent;
      background: none;
      color: var(--lw-ink-muted);
      text-align: left;
      cursor: pointer;
      transition: color var(--lw-dur-fast) var(--lw-ease),
                  border-color var(--lw-dur-fast) var(--lw-ease);
    }
    .topic:hover { color: var(--lw-ink); border-left-color: var(--lw-rule-strong); }
    .topic--active {
      color: var(--lw-ink);
      border-left-color: var(--lw-accent);
    }
    .topic--active strong { font-weight: 600; }
    .topic--active .topic__icon { color: var(--lw-accent); }
    .topic__icon { color: var(--lw-ink-faint); flex-shrink: 0; margin-top: 3px; }
    .topic__text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .topic__text strong { font-size: 13.5px; font-weight: 450; line-height: 1.35; color: inherit; }
    .topic__meta {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--lw-font-mono); font-size: 10px;
      letter-spacing: var(--lw-tracking-micro); text-transform: uppercase;
      color: var(--lw-ink-faint);
    }
    .topic__note-flag { display: inline-flex; color: var(--lw-accent); }

    /* ---- leitor: a página do artigo ---- */
    .reader { min-width: 0; padding-bottom: var(--lw-space-3xl); }
    .reader__head {
      padding-bottom: var(--lw-space-xl);
      margin-bottom: var(--lw-space-xl);
      border-bottom: 1px solid var(--lw-rule);
      max-width: var(--lw-measure);
    }
    .reader__kicker { display: inline-flex; align-items: center; gap: 6px; color: var(--lw-accent); }
    .reader__title {
      font-size: var(--lw-text-display);
      font-weight: 600;
      line-height: 1.08;
      letter-spacing: var(--lw-tracking-display);
      margin: var(--lw-space-sm) 0 var(--lw-space-md);
    }
    .reader__lede {
      font-family: var(--lw-font-prose);
      font-size: 19px;
      font-style: italic;
      line-height: 1.55;
      color: var(--lw-ink-muted);
    }
    .reader__tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--lw-space-sm);
      margin-top: var(--lw-space-lg);
    }
    /* A medida de leitura é o que faz a teoria ficar confortável. */
    .reader__body { max-width: var(--lw-measure); }

    /* ---- botões flutuantes: eles FLUTUAM, logo têm sombra ---- */
    .fabs {
      position: fixed;
      right: var(--lw-space-xl);
      bottom: var(--lw-space-xl);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--lw-space-sm);
      z-index: 60;
    }
    .fab {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--lw-space-sm);
      padding: 11px var(--lw-space-lg);
      border: 1px solid var(--lw-rule);
      border-radius: 999px;
      background: var(--lw-paper-raised);
      box-shadow: var(--lw-lift);
      color: var(--lw-ink);
      font-family: var(--lw-font-mono);
      font-size: 10.5px;
      letter-spacing: var(--lw-tracking-micro);
      text-transform: uppercase;
      cursor: pointer;
      transition: border-color var(--lw-dur-fast) var(--lw-ease),
                  transform var(--lw-dur-fast) var(--lw-ease),
                  box-shadow var(--lw-dur-fast) var(--lw-ease);
      lw-icon { color: var(--lw-ink-muted); }
    }
    .fab:hover { border-color: var(--lw-ink-faint); transform: translateY(-2px); box-shadow: var(--lw-lift-lg); }
    .fab--active { border-color: var(--lw-accent); }
    .fab--active lw-icon { color: var(--lw-accent); }
    .fab__dot {
      position: absolute;
      top: 8px;
      right: 11px;
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--lw-accent);
    }

    /* ---- painel de anotações: uma ficha de leitura ---- */
    .notes {
      position: fixed;
      right: var(--lw-space-xl);
      bottom: 92px;
      width: min(440px, calc(100vw - 44px));
      max-height: min(560px, calc(100vh - 140px));
      display: flex;
      flex-direction: column;
      padding: var(--lw-space-lg);
      border: 1px solid var(--lw-rule);
      border-top: 3px solid var(--lw-accent);
      border-radius: var(--lw-radius);
      background: var(--lw-paper-raised);
      box-shadow: var(--lw-lift-lg);
      z-index: 61;
    }
    .notes__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--lw-space-md);
      padding-bottom: var(--lw-space-sm);
      margin-bottom: var(--lw-space-md);
      border-bottom: 1px solid var(--lw-rule-hair);
    }
    .notes__title {
      display: inline-flex;
      align-items: center;
      gap: var(--lw-space-sm);
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-weight: 600;
      font-size: var(--lw-text-h3);
      color: var(--lw-ink);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      lw-icon { flex-shrink: 0; color: var(--lw-accent); }
    }
    .notes__close {
      background: none; border: none; color: var(--lw-ink-faint);
      cursor: pointer; padding: 5px; border-radius: var(--lw-radius-sm); line-height: 0; flex-shrink: 0;
      &:hover { background: var(--lw-paper-sunken); color: var(--lw-ink); }
    }
    .notes__tabs {
      display: flex;
      align-items: center;
      gap: var(--lw-space-lg);
      padding-bottom: var(--lw-space-xs);
      margin-bottom: var(--lw-space-sm);
      border-bottom: 1px solid var(--lw-rule-hair);
    }
    .notes__tab {
      position: relative;
      background: none;
      border: none;
      padding: 4px 0;
      font-size: 13px;
      font-weight: 450;
      color: var(--lw-ink-muted);
      cursor: pointer;
      &:hover:not(:disabled) { color: var(--lw-ink); }
      &:disabled { opacity: 0.45; cursor: default; }
    }
    .notes__tab--active {
      color: var(--lw-ink);
      font-weight: 600;
    }
    .notes__tab--active::after {
      content: '';
      position: absolute;
      left: 0; right: 0; bottom: -5px;
      height: 2px;
      background: var(--lw-accent);
    }
    .notes__count { margin-left: auto; font-size: 10.5px; color: var(--lw-ink-faint); }
    .notes__count--warn { color: var(--lw-eval-partial); }
    .notes__field {
      width: 100%;
      flex: 1;
      min-height: 180px;
      resize: none;
      font-family: var(--lw-font-mono);
      font-size: 13px;
      line-height: 1.65;
      background: var(--lw-paper-sunken);
    }
    .notes__body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      padding: 2px;
      font-size: 15px;
      line-height: 1.65;
    }
    .md--note :is(p, ul, ol):last-child { margin-bottom: 0; }
    .md--note h2 { border-bottom: none; padding-bottom: 0; }
    .notes__foot {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--lw-space-sm);
      padding-top: var(--lw-space-md);
      margin-top: var(--lw-space-md);
      border-top: 1px solid var(--lw-rule-hair);
    }
    .notes__foot--split { justify-content: space-between; flex-wrap: wrap; }
    .notes__actions { display: inline-flex; align-items: center; gap: var(--lw-space-sm); flex-wrap: wrap; }
    .notes__confirm { font-size: 13px; color: var(--lw-ink-muted); }
    .notes__delete { color: var(--lw-eval-wrong); }
    .notes__stamp {
      font-family: var(--lw-font-mono); font-size: 10px;
      letter-spacing: var(--lw-tracking-micro); text-transform: uppercase;
      color: var(--lw-ink-faint);
    }
    .notes__empty {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--lw-space-md);
    }
    .notes__empty p {
      margin: 0;
      font-family: var(--lw-font-prose);
      font-size: var(--lw-text-body);
      line-height: 1.6;
    }

    @media (max-width: 900px) {
      /* NÃO empilhar com "grid-template-columns: 1fr": numa grade de uma
         coluna o sumário e o artigo caem em LINHAS diferentes, e o bloco de
         contenção de um item grudado é a área dele — ou seja, só a própria
         linha, sem folga nenhuma para deslizar. Em fluxo de blocos o bloco
         de contenção passa a ser o .layout inteiro (a altura do artigo),
         que é o que mantém o sumário preso na tela. */
      .layout { display: block; }
      .sidebar {
        /* Continua grudado — só que agora como faixa horizontal logo abaixo
           do cabeçalho. Antes virava "static" e sumia ao rolar. O papel
           translúcido + blur deixam o artigo passar por baixo sem embolar. */
        top: var(--lw-masthead-h);
        max-height: none;
        overflow: visible;
        margin-bottom: var(--lw-space-xl);
        padding: var(--lw-space-sm) 0 var(--lw-space-md);
        background: var(--lw-paper-veil-strong);
        backdrop-filter: blur(var(--lw-blur-nav));
        -webkit-backdrop-filter: blur(var(--lw-blur-nav));
        padding-right: 0;
        border-right: none;
        border-bottom: 1px solid var(--lw-rule);
      }
      .topics { flex-direction: row; overflow-x: auto; padding-bottom: 4px; }
      .topic {
        min-width: 190px;
        border-left: none;
        border-bottom: 2px solid transparent;
        padding: var(--lw-space-sm) var(--lw-space-md) var(--lw-space-sm) 0;
      }
      .topic:hover { border-left-color: transparent; border-bottom-color: var(--lw-rule-strong); }
      .topic--active { border-left-color: transparent; border-bottom-color: var(--lw-accent); }
      .reader__title { font-size: var(--lw-text-h1); }
      .reader__lede { font-size: 17px; }
      .fabs { right: 14px; bottom: 14px; }
      .fab__label { display: none; }
      .fab { padding: 12px; }
      .notes { right: 14px; bottom: 76px; width: calc(100vw - 28px); }
    }
  `],
})
export class TheoryPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private session = inject(StudySessionService);
  private chatSession = inject(TheoryChatSessionService);

  /** Mesmo limite do backend (VARCHAR(2000) + bean validation). */
  readonly NOTE_MAX = 2000;

  readonly articles = THEORY_ARTICLES;
  readonly selected = signal<TheoryArticle>(THEORY_ARTICLES[0]);

  /** Anotações do usuário indexadas pelo slug do artigo. */
  readonly notes = signal<Record<string, TheoryNote>>({});
  readonly notesOpen = signal(false);
  readonly editing = signal(false);
  readonly previewing = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly confirmingDelete = signal(false);
  readonly chatOpen = signal(false);
  readonly askOpen = signal(false);
  readonly note = computed<TheoryNote | null>(() => this.notes()[this.selected().id] ?? null);

  draft = '';

  ngOnInit(): void {
    // Ler teoria é estudo: o cronômetro roda enquanto a página está aberta.
    this.session.start();
    this.api.theoryNotes().subscribe({
      next: list => {
        const byArticle: Record<string, TheoryNote> = {};
        for (const n of list) byArticle[n.articleId] = n;
        this.notes.set(byArticle);
      },
      error: err => this.toast.apiError(err, 'Não foi possível carregar suas anotações.'),
    });
  }

  ngOnDestroy(): void {
    this.session.end();
    this.chatSession.end();
  }

  select(article: TheoryArticle): void {
    this.selected.set(article);
    this.editing.set(false);
    this.confirmingDelete.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleNotes(): void {
    this.notesOpen.update(open => !open);
    if (!this.notesOpen()) {
      this.editing.set(false);
      this.confirmingDelete.set(false);
    }
  }

  // Os dois painéis de IA ocupam a mesma gaveta à direita: abrir um fecha o outro.
  openChat(): void {
    this.askOpen.set(false);
    this.chatOpen.update(open => !open);
  }

  openAsk(): void {
    this.chatOpen.set(false);
    this.askOpen.update(open => !open);
  }

  startEdit(): void {
    this.draft = this.note()?.content ?? '';
    this.confirmingDelete.set(false);
    this.previewing.set(false);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveNote(): void {
    const content = this.draft.trim();
    if (!content || this.saving()) return;
    this.saving.set(true);
    this.api.saveTheoryNote(this.selected().id, content).subscribe({
      next: saved => {
        this.notes.update(map => ({ ...map, [saved.articleId]: saved }));
        this.saving.set(false);
        this.editing.set(false);
        this.toast.success('Anotação salva!');
      },
      error: err => {
        this.saving.set(false);
        this.toast.apiError(err, 'Não foi possível salvar a anotação.');
      },
    });
  }

  deleteNote(): void {
    if (this.deleting()) return;
    const articleId = this.selected().id;
    this.deleting.set(true);
    this.api.deleteTheoryNote(articleId).subscribe({
      next: () => {
        this.notes.update(map => {
          const copy = { ...map };
          delete copy[articleId];
          return copy;
        });
        this.deleting.set(false);
        this.confirmingDelete.set(false);
        this.toast.success('Anotação apagada', 'Você pode escrever uma nova quando quiser.');
      },
      error: err => {
        this.deleting.set(false);
        this.confirmingDelete.set(false);
        this.toast.apiError(err, 'Não foi possível apagar a anotação.');
      },
    });
  }

  formatStamp(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  }
}
