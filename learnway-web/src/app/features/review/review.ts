import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { StudySessionService } from '../../core/study-session.service';
import { ToastService } from '../../core/toast.service';
import { LessonDetail, ReviewDue, ReviewStats } from '../../core/models';
import { Icon } from '../../shared/icon';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { Crystal, Empty, Spinner } from '../../shared/widgets';

/** Botões de autoavaliação SM-2 (0–5) agrupados em 4 escolhas, estilo Anki. */
const QUALITY_CHOICES = [
  { quality: 1, label: 'Esqueci', hint: 'revisão volta para 1 dia', tone: 'danger' },
  { quality: 3, label: 'Difícil', hint: 'lembrei com esforço', tone: 'warning' },
  { quality: 4, label: 'Bom', hint: 'lembrei bem', tone: 'primary' },
  { quality: 5, label: 'Fácil', hint: 'na ponta da língua', tone: 'success' },
] as const;

@Component({
  selector: 'lw-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, Icon, MarkdownPipe, Crystal, Empty, Spinner],
  template: `
    <div class="page page--review">
      <header class="page-head">
        <span class="lw-label">Revisão espaçada</span>
        <h1 class="page-title">Cristais de conhecimento</h1>
        <p class="page-subtitle">Revisão espaçada (SM-2): revise no momento certo e o intervalo cresce — deixe passar e o cristal apaga.</p>
      </header>

      @if (loading()) {
        <div class="stats"><div class="skeleton" style="height: 86px; flex: 1"></div><div class="skeleton" style="height: 86px; flex: 1"></div><div class="skeleton" style="height: 86px; flex: 1"></div></div>
        <div class="skeleton" style="height: 260px; margin-top: 18px"></div>
      } @else {
        <div class="stats anim-fade-up">
          <div class="rstat" [class.rstat--alert]="(stats()?.overdue ?? 0) > 0">
            <lw-crystal urgency="OVERDUE" [size]="18" />
            <b class="numeral">{{ stats()?.overdue ?? 0 }}</b><span>atrasadas</span>
          </div>
          <div class="rstat">
            <lw-crystal urgency="DUE_TODAY" [size]="18" />
            <b class="numeral">{{ stats()?.dueToday ?? 0 }}</b><span>para hoje</span>
          </div>
          <div class="rstat">
            <lw-crystal urgency="NORMAL" [size]="18" />
            <b class="numeral">{{ stats()?.totalScheduled ?? 0 }}</b><span>agendadas</span>
          </div>
        </div>

        @if (due().length === 0) {
          <div class="card" style="margin-top: 18px">
            <lw-empty icon="gem" title="Todos os cristais estão brilhando!"
                      message="Nenhuma revisão pendente. Complete novas lições para criar mais cristais de conhecimento.">
              @if (stats()?.nextReviewAt) {
                <p class="muted">Próxima revisão: <b>{{ stats()?.nextReviewAt | date: "dd/MM 'às' HH:mm" }}</b></p>
              }
              <a class="btn btn--primary" routerLink="/trilha">Ir para a trilha</a>
            </lw-empty>
          </div>
        }

        <div class="queue">
          @for (item of due(); track item.lessonId) {
            <div class="card rev anim-fade-up" [class.rev--overdue]="item.urgencyLevel === 'OVERDUE'">
              <div class="rev__head" (click)="toggle(item)">
                <lw-crystal [urgency]="item.urgencyLevel" [size]="26" />
                <div class="rev__info">
                  <strong>{{ item.lessonTitle }}</strong>
                  <span class="muted">{{ item.topicTitle }} · {{ item.subtopicTitle }}</span>
                </div>
                <div class="rev__meta">
                  @switch (item.urgencyLevel) {
                    @case ('OVERDUE') { <span class="chip chip--danger">atrasada</span> }
                    @case ('DUE_TODAY') { <span class="chip chip--warning">para hoje</span> }
                    @default { <span class="chip">agendada</span> }
                  }
                  <span class="muted rev__interval">intervalo: {{ item.intervalDays }}d · {{ item.repetitions }} revisõe{{ item.repetitions === 1 ? '' : 's' }}</span>
                </div>
                <button class="btn btn--secondary btn--sm">
                  {{ openId() === item.lessonId ? 'Fechar' : 'Revisar' }}
                </button>
              </div>

              @if (openId() === item.lessonId) {
                <div class="rev__body anim-fade-up">
                  @if (theoryLoading()) {
                    <div class="skeleton" style="height: 160px"></div>
                  } @else if (theory(); as t) {
                    <p class="rev__instruction"><lw-icon name="brain" [size]="15" /> Releia a teoria e tente se lembrar dos pontos-chave antes de se avaliar.</p>
                    <div class="rev__theory md" [innerHTML]="t.theoryContent | markdown"></div>
                  }

                  <div class="rev__rate">
                    <span class="rev__rate-label">Como foi lembrar deste conteúdo?</span>
                    <div class="rev__choices">
                      @for (choice of choices; track choice.quality) {
                        <button class="qbtn" [class]="'qbtn qbtn--' + choice.tone"
                                [disabled]="rating()"
                                (click)="rate(item, choice.quality)">
                          @if (rating() && ratingQuality() === choice.quality) { <lw-spinner [size]="14" /> }
                          <b>{{ choice.label }}</b>
                          <small>{{ choice.hint }}</small>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page--review { max-width: 840px; }

    .stats {
      display: flex;
      border-top: 1px solid var(--lw-rule);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-xl);
    }
    .stats > .skeleton { border: none; border-radius: 0; margin: var(--lw-space-lg) 0; }
    .rstat {
      flex: 1;
      display: flex; flex-direction: column; gap: 2px;
      padding: var(--lw-space-lg);
      b { font-size: 34px; font-weight: 500; line-height: 1.05; }
      span { color: var(--lw-ink-muted); font-size: 12.5px; }
      lw-crystal { margin-bottom: 4px; }
    }
    .rstat + .rstat { border-left: 1px solid var(--lw-rule-hair); }
    .rstat--alert b { color: var(--lw-eval-wrong); }

    .queue { display: flex; flex-direction: column; gap: var(--lw-space-md); }
    .rev { padding: 0; overflow: hidden; }
    .rev--overdue { border-color: var(--lw-eval-wrong-edge); }
    .rev__head {
      display: flex; align-items: center; gap: var(--lw-space-md);
      padding: var(--lw-space-lg);
      cursor: pointer;
      transition: background var(--lw-dur-fast) var(--lw-ease);
      &:hover { background: var(--lw-paper-sunken); }
    }
    .rev__info {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: 1px;
      strong {
        font-family: var(--lw-font-display);
        font-variation-settings: var(--lw-display-variation);
        font-size: var(--lw-text-h3); font-weight: 600; line-height: 1.25;
      }
      .muted { font-size: 12px; }
    }
    .rev__meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .rev__interval {
      font-family: var(--lw-font-mono); font-size: 10px;
      letter-spacing: var(--lw-tracking-micro); text-transform: uppercase;
    }

    .rev__body { border-top: 1px solid var(--lw-rule); padding: var(--lw-space-lg); }
    .rev__instruction {
      display: flex; align-items: center; gap: var(--lw-space-sm);
      font-family: var(--lw-font-prose); font-style: italic;
      font-size: var(--lw-text-body); color: var(--lw-ink-muted);
      margin-bottom: var(--lw-space-md);
      lw-icon { color: var(--lw-accent); flex-shrink: 0; }
    }
    /* A teoria releitura é papel rebaixado com medida de leitura. */
    .rev__theory {
      max-height: 340px;
      overflow-y: auto;
      background: var(--lw-paper-sunken);
      border-radius: var(--lw-radius);
      padding: var(--lw-space-lg) var(--lw-space-xl);
      margin-bottom: var(--lw-space-xl);
      font-size: 15.5px;
    }
    .rev__rate-label {
      display: block;
      font-family: var(--lw-font-mono); font-size: 10.5px;
      text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
      color: var(--lw-ink-faint);
      margin-bottom: var(--lw-space-sm);
    }
    .rev__choices { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--lw-space-sm); }
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
      b { font-size: var(--lw-text-sm); font-weight: 550; }
      small { font-size: 10px; color: var(--lw-ink-faint); text-align: center; }
      &:not(:disabled):hover { transform: translateY(-2px); }
      &:disabled { opacity: 0.55; cursor: wait; }
    }
    .qbtn--danger:not(:disabled):hover  { border-color: var(--lw-eval-wrong); color: var(--lw-eval-wrong); background: var(--lw-eval-wrong-bg); }
    .qbtn--warning:not(:disabled):hover { border-color: var(--lw-eval-partial); color: var(--lw-eval-partial); background: var(--lw-eval-partial-bg); }
    .qbtn--primary:not(:disabled):hover { border-color: var(--lw-ink); background: var(--lw-paper-sunken); }
    .qbtn--success:not(:disabled):hover { border-color: var(--lw-eval-correct); color: var(--lw-eval-correct); background: var(--lw-eval-correct-bg); }

    @media (max-width: 640px) {
      .stats { flex-direction: column; }
      .rstat + .rstat { border-left: none; border-top: 1px solid var(--lw-rule-hair); }
      .rev__choices { grid-template-columns: 1fr 1fr; }
      .rev__meta { display: none; }
      .rev__theory { padding: var(--lw-space-md); }
    }
  `],
})
export class ReviewQueue implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private session = inject(StudySessionService);

  readonly choices = QUALITY_CHOICES;
  readonly loading = signal(true);
  readonly due = signal<ReviewDue[]>([]);
  readonly stats = signal<ReviewStats | null>(null);
  readonly openId = signal<string | null>(null);
  readonly theory = signal<LessonDetail | null>(null);
  readonly theoryLoading = signal(false);
  readonly rating = signal(false);
  readonly ratingQuality = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    // O cronômetro conta apenas estudo de verdade: roda enquanto as revisões estão abertas.
    this.session.start();
    await this.reload();
  }

  ngOnDestroy(): void {
    this.session.end();
  }

  private async reload(): Promise<void> {
    try {
      const [due, stats] = await Promise.all([
        firstValueFrom(this.api.reviewsDue()),
        firstValueFrom(this.api.reviewStats()),
      ]);
      this.due.set(due);
      this.stats.set(stats);
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar as revisões.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(item: ReviewDue): Promise<void> {
    if (this.openId() === item.lessonId) {
      this.openId.set(null);
      return;
    }
    this.openId.set(item.lessonId);
    this.theory.set(null);
    this.theoryLoading.set(true);
    try {
      this.theory.set(await firstValueFrom(this.api.lesson(item.lessonId)));
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar a teoria.');
    } finally {
      this.theoryLoading.set(false);
    }
  }

  async rate(item: ReviewDue, quality: number): Promise<void> {
    if (this.rating()) return;
    this.rating.set(true);
    this.ratingQuality.set(quality);
    try {
      const result = await firstValueFrom(this.api.completeReview(item.lessonId, quality));
      if (result.xpEarned > 0) this.toast.xp(result.xpEarned, 'revisão concluída');
      for (const a of result.newAchievements ?? []) this.toast.achievement(a.title, a.xpBonus, a.icon);
      const next = new Date(result.nextReviewAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      this.toast.success(
        quality >= 3 ? 'Cristal recarregado! 💎' : 'Sem problemas — repetir faz parte.',
        `Próxima revisão em ${result.intervalDays} dia${result.intervalDays === 1 ? '' : 's'} (${next}).`,
      );
      this.openId.set(null);
      await this.reload();
      this.refreshUser();
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível registrar a revisão.');
    } finally {
      this.rating.set(false);
      this.ratingQuality.set(null);
    }
  }

  private async refreshUser(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.api.profile());
      this.auth.setUser(profile.user);
    } catch { /* ignora */ }
  }
}
