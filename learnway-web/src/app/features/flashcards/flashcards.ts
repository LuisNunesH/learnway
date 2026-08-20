import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { StudySessionService } from '../../core/study-session.service';
import { ToastService } from '../../core/toast.service';
import { FlashcardDeck, FlashcardDue } from '../../core/models';
import { Icon } from '../../shared/icon';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { Empty, Spinner } from '../../shared/widgets';

/** Autoavaliação SM-2 (0–5) agrupada em 4 escolhas, estilo Anki. */
const QUALITY_CHOICES = [
  { quality: 1, key: '1', label: 'Esqueci', hint: 'volta nesta sessão', tone: 'danger' },
  { quality: 3, key: '2', label: 'Difícil', hint: 'lembrei com esforço', tone: 'warning' },
  { quality: 4, key: '3', label: 'Bom', hint: 'lembrei bem', tone: 'primary' },
  { quality: 5, key: '4', label: 'Fácil', hint: 'na ponta da língua', tone: 'success' },
] as const;

type Mode = 'decks' | 'study' | 'summary';

@Component({
  selector: 'lw-flashcards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, Icon, MarkdownPipe, Empty, Spinner],
  template: `
    <div class="page page--cards">
      @switch (mode()) {

        <!-- ══ Baralhos ══════════════════════════════════════════════ -->
        @case ('decks') {
          <header class="page-head">
            <span class="lw-label">Memória</span>
            <h1 class="page-title">Flashcards</h1>
            <p class="page-subtitle">Cada lição concluída vira um baralho de conceitos. As cartas voltam no momento certo de revisar — estilo Anki.</p>
          </header>

          @if (loading()) {
            <div class="stats"><div class="skeleton" style="height: 86px; flex: 1"></div><div class="skeleton" style="height: 86px; flex: 1"></div><div class="skeleton" style="height: 86px; flex: 1"></div></div>
            <div class="skeleton" style="height: 220px; margin-top: 18px"></div>
          } @else {
            <div class="stats anim-fade-up">
              <div class="fstat" [class.fstat--alert]="dueTotal() > 0">
                <lw-icon name="hourglass" [size]="18" />
                <b class="numeral">{{ dueTotal() }}</b><span>para revisar</span>
              </div>
              <div class="fstat">
                <lw-icon name="sparkles" [size]="18" />
                <b class="numeral">{{ newTotal() }}</b><span>novas</span>
              </div>
              <div class="fstat">
                <lw-icon name="cards" [size]="18" />
                <b class="numeral">{{ totalCards() }}</b><span>no total</span>
              </div>
            </div>

            @if (decks().length === 0) {
              <div class="card" style="margin-top: 18px">
                <lw-empty icon="cards" title="Nenhum baralho ainda"
                          message="Complete lições na trilha para desbloquear os flashcards dos conceitos que você estudou.">
                  <a class="btn btn--primary" routerLink="/trilha">Ir para a trilha</a>
                </lw-empty>
              </div>
            } @else {
              @if (readyTotal() > 0) {
                <button class="btn btn--primary studyall anim-fade-up" (click)="startStudy()">
                  <lw-icon name="play" [size]="16" />
                  Estudar agora ({{ readyTotal() }} carta{{ readyTotal() === 1 ? '' : 's' }})
                </button>
              } @else {
                <div class="allgood anim-fade-up">
                  <lw-icon name="check" [size]="17" />
                  <span>Tudo em dia! Nenhuma carta para revisar agora.</span>
                  @if (nextDueAt(); as next) {
                    <span class="muted">Próxima: <b>{{ next | date: "dd/MM 'às' HH:mm" }}</b></span>
                  }
                </div>
              }

              <div class="decks">
                @for (deck of decks(); track deck.lessonId) {
                  <div class="card deck anim-fade-up">
                    <div class="deck__info">
                      <strong>{{ deck.lessonTitle }}</strong>
                      <span class="muted">{{ deck.topicTitle }} · {{ deck.subtopicTitle }}</span>
                    </div>
                    <div class="deck__chips">
                      @if (deck.dueCards > 0) { <span class="chip chip--warning">{{ deck.dueCards }} para revisar</span> }
                      @if (deck.newCards > 0) { <span class="chip">{{ deck.newCards }} nova{{ deck.newCards === 1 ? '' : 's' }}</span> }
                      @if (deck.dueCards === 0 && deck.newCards === 0) {
                        <span class="chip chip--success">em dia</span>
                        @if (deck.nextReviewAt) { <span class="muted deck__next">volta {{ deck.nextReviewAt | date: 'dd/MM' }}</span> }
                      }
                      <span class="muted deck__total">{{ deck.totalCards }} cartas</span>
                    </div>
                    <button class="btn btn--sm deck__btn"
                            [class.btn--secondary]="deck.dueCards + deck.newCards > 0"
                            [disabled]="deck.dueCards + deck.newCards === 0"
                            (click)="startStudy(deck)">
                      Estudar
                    </button>
                  </div>
                }
              </div>
            }
          }
        }

        <!-- ══ Estudo ════════════════════════════════════════════════ -->
        @case ('study') {
          @if (current(); as card) {
            <div class="studybar">
              <button class="btn btn--sm" (click)="quitStudy()"><lw-icon name="arrow-left" [size]="15" /> Sair</button>
              <span class="studybar__title">{{ studyTitle() }}</span>
              <span class="chip mono">{{ sessionDone() }} feita{{ sessionDone() === 1 ? '' : 's' }} · {{ queue().length }} restante{{ queue().length === 1 ? '' : 's' }}</span>
            </div>

            <div class="stage">
              <div class="flip" [class.flip--flipped]="flipped()">
                <div class="card face face--front" (click)="flip()">
                  <div class="face__tags">
                    @if (card.isNew) { <span class="chip">nova</span> }
                    @else { <span class="chip">intervalo {{ card.intervalDays }}d · {{ card.repetitions }} rev.</span> }
                    <span class="muted face__lesson">{{ card.lessonTitle }}</span>
                  </div>
                  <div class="face__text md" [innerHTML]="card.frontText | markdown"></div>
                  <div class="face__foot">
                    <span class="muted">clique na carta ou tecle <kbd>espaço</kbd></span>
                    <button class="btn btn--primary btn--sm" (click)="flip(); $event.stopPropagation()">Mostrar resposta</button>
                  </div>
                </div>
                <div class="card face face--back">
                  <div class="face__tags">
                    <span class="chip chip--success">resposta</span>
                    <span class="muted face__lesson">{{ card.lessonTitle }}</span>
                  </div>
                  <div class="face__text face__text--back md" [innerHTML]="card.backText | markdown"></div>
                </div>
              </div>
            </div>

            <div class="rate" [class.rate--hidden]="!flipped()">
              <span class="rate__label">Como foi lembrar?</span>
              <div class="rate__choices">
                @for (choice of choices; track choice.quality) {
                  <button class="qbtn" [class]="'qbtn qbtn--' + choice.tone"
                          [disabled]="!flipped() || grading()"
                          (click)="rate(choice.quality)">
                    @if (grading() && gradingQuality() === choice.quality) { <lw-spinner [size]="14" /> }
                    <b>{{ choice.label }} <kbd>{{ choice.key }}</kbd></b>
                    <small>{{ choice.hint }}</small>
                  </button>
                }
              </div>
            </div>
          }
        }

        <!-- ══ Resumo ════════════════════════════════════════════════ -->
        @case ('summary') {
          <div class="summary anim-pop">
            <lw-icon name="sparkles" [size]="34" />
            <h2>Sessão concluída</h2>
            <div class="summary__grid">
              <div><b class="numeral">{{ sessionDone() }}</b><span>carta{{ sessionDone() === 1 ? '' : 's' }}</span></div>
              <div><b class="numeral">{{ accuracy() }}%</b><span>de acerto</span></div>
              <div><b class="numeral summary__xp">+{{ sessionXp() }}</b><span>XP</span></div>
            </div>
            <p class="muted">As cartas que você acertou vão esperar mais tempo até a próxima revisão — as difíceis voltam logo.</p>
            <button class="btn btn--primary" (click)="backToDecks()">Voltar aos baralhos</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page--cards { max-width: 840px; }

    /* ── baralhos: faixa de leituras, igual ao painel ─────────────── */
    .stats {
      display: flex;
      border-top: 1px solid var(--lw-rule);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-xl);
    }
    .stats > .skeleton { border: none; border-radius: 0; margin: var(--lw-space-lg) 0; }
    .fstat {
      flex: 1;
      display: flex; flex-direction: column; gap: 2px;
      padding: var(--lw-space-lg);
      color: var(--lw-ink-muted);
      b { font-size: 34px; font-weight: 500; line-height: 1.05; color: var(--lw-ink); }
      span { font-size: 12.5px; }
      lw-icon { color: var(--lw-ink-faint); margin-bottom: 4px; }
    }
    .fstat + .fstat { border-left: 1px solid var(--lw-rule-hair); }
    .fstat--alert b { color: var(--lw-eval-partial); }

    .studyall {
      display: inline-flex; align-items: center; gap: var(--lw-space-sm);
      margin-bottom: var(--lw-space-lg);
    }
    .allgood {
      display: flex; align-items: center; gap: var(--lw-space-sm); flex-wrap: wrap;
      padding: var(--lw-space-md) var(--lw-space-lg);
      margin-bottom: var(--lw-space-lg);
      background: var(--lw-eval-correct-bg);
      border-left: 3px solid var(--lw-eval-correct);
      border-radius: 0 var(--lw-radius) var(--lw-radius) 0;
      color: var(--lw-eval-correct);
      font-weight: 550; font-size: var(--lw-text-sm);
      .muted { font-weight: 400; }
    }

    .decks { display: grid; grid-template-columns: 1fr 1fr; gap: var(--lw-space-md); }
    .deck {
      display: flex; flex-direction: column; gap: var(--lw-space-sm);
      padding: var(--lw-space-lg);
    }
    .deck__info {
      display: flex; flex-direction: column; gap: 2px;
      strong {
        font-family: var(--lw-font-display);
        font-variation-settings: var(--lw-display-variation);
        font-size: var(--lw-text-h3); font-weight: 600; line-height: 1.25;
      }
      .muted { font-size: 12px; }
    }
    .deck__chips { display: flex; align-items: center; gap: var(--lw-space-sm); flex-wrap: wrap; }
    .deck__total, .deck__next { font-family: var(--lw-font-mono); font-size: 10.5px; }
    .deck__btn { align-self: flex-start; margin-top: auto; }

    /* ── estudo ───────────────────────────────────────────────────── */
    .studybar {
      display: flex; align-items: center; gap: var(--lw-space-md);
      padding-bottom: var(--lw-space-md);
      border-bottom: 1px solid var(--lw-rule);
      .studybar__title {
        flex: 1;
        font-family: var(--lw-font-display);
        font-variation-settings: var(--lw-display-variation);
        font-weight: 600; font-size: var(--lw-text-h3);
        text-align: center;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
    }

    /* O flip 3D fica: é uma afordância de movimento, não uma forma. */
    .stage { perspective: 1600px; margin-top: var(--lw-space-xl); }
    .flip {
      position: relative;
      height: min(400px, 62vh);
      transform-style: preserve-3d;
      transition: transform 0.55s var(--lw-ease);
    }
    .flip--flipped { transform: rotateY(180deg); }
    .face {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      display: flex; flex-direction: column; gap: var(--lw-space-md);
      padding: var(--lw-space-lg) var(--lw-space-xl);
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-top: 3px solid var(--lw-rule-strong);
      border-radius: var(--lw-radius);
      box-shadow: var(--lw-lift-sm);
    }
    .face--front { cursor: pointer; }
    .face--back { transform: rotateY(180deg); border-top-color: var(--lw-eval-correct); }
    .face__tags { display: flex; align-items: center; gap: var(--lw-space-sm); }
    .face__lesson { font-family: var(--lw-font-mono); font-size: 10.5px; margin-left: auto; }

    /* A frente é a pergunta: serifa grande, centrada, como uma epígrafe. */
    .face__text {
      flex: 1;
      display: flex; flex-direction: column; justify-content: center;
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-size: 27px; font-weight: 500; line-height: 1.3;
      letter-spacing: var(--lw-tracking-tight);
      text-align: center;
      overflow-y: auto;
    }
    .face__text--back {
      font-family: var(--lw-font-prose);
      font-size: 16.5px; font-weight: 400; line-height: 1.7;
      letter-spacing: 0;
      text-align: left; justify-content: flex-start; padding-top: 6px;
    }
    .face__foot {
      display: flex; align-items: center; justify-content: space-between; gap: var(--lw-space-sm);
      .muted { font-size: 12px; }
    }

    kbd {
      font-family: var(--lw-font-mono);
      font-size: 10px;
      padding: 1px 5px;
      border: 1px solid var(--lw-rule-strong);
      border-bottom-width: 2px;
      border-radius: var(--lw-radius-sm);
      background: var(--lw-paper-sunken);
      color: var(--lw-ink-muted);
    }

    .rate { margin-top: var(--lw-space-lg); transition: opacity var(--lw-dur-fast); }
    .rate--hidden { opacity: 0; pointer-events: none; }
    .rate__label {
      display: block;
      font-family: var(--lw-font-mono); font-size: 10.5px;
      text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
      color: var(--lw-ink-faint);
      margin-bottom: var(--lw-space-sm);
    }
    .rate__choices { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--lw-space-sm); }
    .qbtn {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      padding: var(--lw-space-md) var(--lw-space-sm);
      border-radius: var(--lw-radius);
      border: 1px solid var(--lw-rule);
      background: var(--lw-paper-raised);
      color: var(--lw-ink);
      cursor: pointer;
      transition: transform var(--lw-dur-fast) var(--lw-ease),
                  border-color var(--lw-dur-fast) var(--lw-ease),
                  background var(--lw-dur-fast) var(--lw-ease);
      b { font-size: var(--lw-text-sm); font-weight: 550; display: inline-flex; align-items: center; gap: 6px; }
      small { font-size: 10px; color: var(--lw-ink-faint); text-align: center; }
      &:not(:disabled):hover { transform: translateY(-2px); }
      &:disabled { opacity: 0.55; cursor: default; }
    }
    .qbtn--danger:not(:disabled):hover  { border-color: var(--lw-eval-wrong); color: var(--lw-eval-wrong); background: var(--lw-eval-wrong-bg); }
    .qbtn--warning:not(:disabled):hover { border-color: var(--lw-eval-partial); color: var(--lw-eval-partial); background: var(--lw-eval-partial-bg); }
    .qbtn--primary:not(:disabled):hover { border-color: var(--lw-ink); background: var(--lw-paper-sunken); }
    .qbtn--success:not(:disabled):hover { border-color: var(--lw-eval-correct); color: var(--lw-eval-correct); background: var(--lw-eval-correct-bg); }

    /* ── resumo ───────────────────────────────────────────────────── */
    .summary {
      max-width: 460px;
      margin: var(--lw-space-2xl) auto 0;
      display: flex; flex-direction: column; align-items: center; gap: var(--lw-space-lg);
      padding: var(--lw-space-2xl) var(--lw-space-xl);
      text-align: center;
      lw-icon { color: var(--lw-accent); }
      h2 { font-size: var(--lw-text-h1); font-weight: 600; }
      p { font-family: var(--lw-font-prose); font-size: var(--lw-text-body); line-height: 1.6; }
    }
    .summary__grid {
      display: flex;
      width: 100%;
      border-top: 1px solid var(--lw-rule);
      border-bottom: 1px solid var(--lw-rule);
      div { flex: 1; display: flex; flex-direction: column; gap: 1px; padding: var(--lw-space-lg) var(--lw-space-sm); }
      div + div { border-left: 1px solid var(--lw-rule-hair); }
      b { font-size: 30px; font-weight: 500; line-height: 1; }
      span {
        font-family: var(--lw-font-mono); font-size: 10px;
        text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
        color: var(--lw-ink-faint);
      }
    }
    .summary__xp { color: var(--lw-accent); }

    @media (max-width: 640px) {
      .stats { flex-direction: column; }
      .fstat + .fstat { border-left: none; border-top: 1px solid var(--lw-rule-hair); }
      .decks { grid-template-columns: 1fr; }
      .rate__choices { grid-template-columns: 1fr 1fr; }
      .face__text { font-size: 21px; }
      .studybar__title { display: none; }
    }
  `],
})
export class FlashcardsPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private session = inject(StudySessionService);

  readonly choices = QUALITY_CHOICES;
  readonly loading = signal(true);
  readonly mode = signal<Mode>('decks');
  readonly decks = signal<FlashcardDeck[]>([]);

  // sessão de estudo
  readonly queue = signal<FlashcardDue[]>([]);
  readonly current = computed(() => this.queue()[0] ?? null);
  readonly flipped = signal(false);
  readonly grading = signal(false);
  readonly gradingQuality = signal<number | null>(null);
  readonly studyTitle = signal('Todos os baralhos');
  readonly sessionDone = signal(0);
  readonly sessionCorrect = signal(0);
  readonly sessionXp = signal(0);

  readonly dueTotal = computed(() => this.decks().reduce((s, d) => s + d.dueCards, 0));
  readonly newTotal = computed(() => this.decks().reduce((s, d) => s + d.newCards, 0));
  readonly totalCards = computed(() => this.decks().reduce((s, d) => s + d.totalCards, 0));
  readonly readyTotal = computed(() => this.dueTotal() + this.newTotal());
  readonly accuracy = computed(() =>
    this.sessionDone() === 0 ? 0 : Math.round((this.sessionCorrect() / this.sessionDone()) * 100));
  readonly nextDueAt = computed(() => {
    const dates = this.decks().map(d => d.nextReviewAt).filter((d): d is string => !!d);
    return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  });

  async ngOnInit(): Promise<void> {
    // Estudo de flashcards conta como tempo de estudo real.
    this.session.start();
    await this.loadDecks();
  }

  ngOnDestroy(): void {
    this.session.end();
  }

  private async loadDecks(): Promise<void> {
    try {
      this.decks.set(await firstValueFrom(this.api.flashcardDecks()));
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar os flashcards.');
    } finally {
      this.loading.set(false);
    }
  }

  async startStudy(deck?: FlashcardDeck): Promise<void> {
    try {
      const cards = await firstValueFrom(this.api.flashcardsDue(deck?.lessonId));
      if (cards.length === 0) {
        this.toast.success('Tudo em dia!', 'Nenhuma carta para estudar agora.');
        return;
      }
      this.queue.set(cards);
      this.studyTitle.set(deck?.lessonTitle ?? 'Todos os baralhos');
      this.flipped.set(false);
      this.sessionDone.set(0);
      this.sessionCorrect.set(0);
      this.sessionXp.set(0);
      this.mode.set('study');
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível iniciar o estudo.');
    }
  }

  flip(): void {
    if (!this.flipped()) this.flipped.set(true);
  }

  async rate(quality: number): Promise<void> {
    const card = this.current();
    if (!card || this.grading() || !this.flipped()) return;
    this.grading.set(true);
    this.gradingQuality.set(quality);
    try {
      const result = await firstValueFrom(this.api.gradeFlashcard(card.flashcardId, quality));
      this.sessionDone.update(n => n + 1);
      if (quality >= 3) this.sessionCorrect.update(n => n + 1);
      this.sessionXp.update(n => n + result.xpEarned);
      for (const a of result.newAchievements ?? []) this.toast.achievement(a.title, a.xpBonus, a.icon);

      this.queue.update(q => {
        const rest = q.slice(1);
        if (quality < 3) {
          // Errou: a carta volta ao fim da fila, como no Anki.
          rest.push({ ...card, isNew: false, intervalDays: result.intervalDays, repetitions: result.repetitions });
        }
        return rest;
      });
      this.flipped.set(false);
      if (this.queue().length === 0) this.finishSession();
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível registrar a avaliação.');
    } finally {
      this.grading.set(false);
      this.gradingQuality.set(null);
    }
  }

  quitStudy(): void {
    if (this.sessionDone() > 0) {
      this.finishSession();
    } else {
      this.mode.set('decks');
    }
  }

  private finishSession(): void {
    this.mode.set('summary');
    if (this.sessionXp() > 0) this.toast.xp(this.sessionXp(), 'sessão de flashcards');
    this.refreshUser();
  }

  async backToDecks(): Promise<void> {
    this.mode.set('decks');
    this.loading.set(true);
    await this.loadDecks();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.mode() !== 'study' || !this.current()) return;
    if (event.code === 'Space' || event.key === 'Enter') {
      if (!this.flipped()) {
        event.preventDefault();
        this.flip();
      }
      return;
    }
    if (this.flipped() && !this.grading()) {
      const choice = QUALITY_CHOICES.find(c => c.key === event.key);
      if (choice) this.rate(choice.quality);
    }
  }

  private async refreshUser(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.api.profile());
      this.auth.setUser(profile.user);
    } catch { /* ignora */ }
  }
}
