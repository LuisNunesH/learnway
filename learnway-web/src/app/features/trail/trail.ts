import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { LessonNode, SubtopicNode, Trail } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Crystal, Difficulty, ProgressBar } from '../../shared/widgets';

@Component({
  selector: 'lw-trail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, Icon, Crystal, Difficulty, ProgressBar],
  template: `
    <div class="page page--narrow">
      <header class="page-head">
        <span class="lw-label">Mapa</span>
        <h1 class="page-title">Mapa da trilha</h1>
        <p class="page-subtitle">Complete lições para desbloquear os próximos passos. Cristais vermelhos pedem revisão.</p>
      </header>

      @if (loading()) {
        <div class="skeleton" style="height: 72px; margin-bottom: 16px"></div>
        <div class="skeleton" style="height: 420px"></div>
      }

      @for (topic of trail()?.topics ?? []; track topic.id) {
        <section class="topic anim-fade-up" [id]="topic.slug">
          <!-- Abertura de capítulo: fio grosso, ícone, título em serifa. -->
          <header class="topic__head">
            <lw-icon [name]="topic.icon ?? 'star'" [size]="20" class="topic__icon" />
            <h2 class="topic__title">{{ topic.title }}</h2>
            @if (topic.totalLessons > 0) {
              <span class="topic__progress">
                <lw-progress [value]="(topic.completedLessons / topic.totalLessons) * 100" [height]="4" />
              </span>
              <span class="topic__count mono">{{ topic.completedLessons }}/{{ topic.totalLessons }}</span>
            } @else {
              <span class="chip">Em breve</span>
            }
          </header>

          @for (sub of topic.subtopics; track sub.id) {
            <div class="subtopic" [class.subtopic--locked]="sub.locked">
              <div class="subtopic__title">
                @if (sub.locked) { <lw-icon name="lock" [size]="12" /> }
                <h3>{{ sub.title }}</h3>
                @if (sub.locked) {
                  <span class="subtopic__req">complete “{{ prereqTitle(sub) }}” para desbloquear</span>
                }
              </div>

              <!-- A trilha é uma espinha vertical: cada lição é um item do sumário. -->
              <div class="path">
                @for (lesson of sub.lessons; track lesson.id; let i = $index) {
                  <button class="node"
                          [class]="'node node--' + lesson.status.toLowerCase()"
                          [disabled]="sub.locked"
                          (click)="open(lesson, sub)"
                          [attr.aria-label]="lesson.title">
                    <span class="node__marker">
                      @switch (lesson.status) {
                        @case ('LOCKED') { <lw-icon name="lock" [size]="13" /> }
                        @case ('AVAILABLE') { <span class="node__num numeral">{{ i + 1 }}</span> }
                        @case ('COMPLETED') { <lw-icon name="check" [size]="16" /> }
                        @case ('REVIEW') { <lw-icon name="gem" [size]="15" /> }
                      }
                    </span>
                    <span class="node__body">
                      <strong class="node__title">{{ lesson.title }}</strong>
                      <span class="node__meta">
                        <lw-difficulty [level]="lesson.difficultyLevel" />
                        <span class="node__sep">·</span> +{{ lesson.xpReward }} XP
                        @if (lesson.scorePercentage != null) {
                          <span class="node__sep">·</span> {{ lesson.scorePercentage | number: '1.0-0' }}%
                        }
                      </span>
                    </span>
                    @if (lesson.status === 'COMPLETED') {
                      <lw-crystal [urgency]="lesson.crystalUrgency ?? 'NORMAL'" [size]="15" class="node__crystal" />
                    } @else if (!sub.locked && lesson.status !== 'LOCKED') {
                      <lw-icon name="arrow-right" [size]="15" class="node__go" />
                    }
                  </button>
                }
              </div>
            </div>
          }

          @if (topic.subtopics.length === 0) {
            <p class="muted topic__soon">Esta trilha ainda está sendo forjada.</p>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    /* ---- abertura de capítulo ---- */
    .topic { margin-bottom: var(--lw-space-2xl); scroll-margin-top: 90px; }
    .topic__head {
      display: flex; align-items: center; gap: var(--lw-space-md);
      padding-top: var(--lw-space-md);
      padding-bottom: var(--lw-space-md);
      border-top: 2px solid var(--lw-ink);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-lg);
    }
    .topic__icon { color: var(--lw-accent); flex-shrink: 0; }
    .topic__title {
      flex: 1; min-width: 0;
      font-size: var(--lw-text-h2);
      font-weight: 600;
    }
    .topic__progress { width: 110px; flex-shrink: 0; }
    .topic__count { font-size: 11.5px; color: var(--lw-ink-muted); flex-shrink: 0; }
    .topic__soon {
      font-family: var(--lw-font-prose);
      font-style: italic;
      padding: var(--lw-space-md) 0;
    }

    /* ---- subtópico ---- */
    .subtopic { margin-bottom: var(--lw-space-lg); }
    .subtopic--locked { opacity: 0.55; }
    .subtopic__title {
      display: flex; align-items: baseline; gap: var(--lw-space-sm);
      margin: var(--lw-space-xl) 0 var(--lw-space-sm);
      color: var(--lw-ink-faint);
      h3 {
        font-family: var(--lw-font-mono); font-size: 10.5px;
        text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
        color: var(--lw-ink-muted); font-weight: 500;
      }
    }
    .subtopic__req { font-size: 12px; font-style: italic; font-family: var(--lw-font-prose); }

    /* ---- a espinha: um fio vertical que os marcadores atravessam ---- */
    .path { position: relative; display: flex; flex-direction: column; }
    .path::before {
      content: '';
      position: absolute;
      left: 17px; top: 18px; bottom: 18px;
      width: 1px;
      background: var(--lw-rule);
    }

    .node {
      position: relative;
      width: 100%;
      background: none; border: none;
      padding: var(--lw-space-sm) var(--lw-space-sm) var(--lw-space-sm) 0;
      display: flex; align-items: center; gap: var(--lw-space-md);
      text-align: left;
      cursor: pointer;
      border-radius: var(--lw-radius-sm);
      transition: background var(--lw-dur-fast) var(--lw-ease);
      &:disabled { cursor: not-allowed; }
      &:not(:disabled):hover { background: var(--lw-paper-sunken); }
      &:not(:disabled):hover .node__go { opacity: 1; transform: translateX(0); }
    }

    .node__marker {
      position: relative;
      z-index: 1;
      width: 34px; height: 34px; flex-shrink: 0;
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--lw-rule-strong);
      background: var(--lw-paper);
      color: var(--lw-ink-faint);
      transition: border-color var(--lw-dur-fast) var(--lw-ease),
                  background var(--lw-dur-fast) var(--lw-ease),
                  color var(--lw-dur-fast) var(--lw-ease);
    }
    .node__num { font-size: 15px; font-weight: 500; line-height: 1; }

    /* AVAILABLE = o próximo passo: o único terracota da lista. */
    .node--available .node__marker {
      border-color: var(--lw-accent);
      color: var(--lw-accent);
      background: var(--lw-paper-raised);
      box-shadow: 0 0 0 3px var(--lw-accent-wash);
    }
    .node--available .node__title { font-weight: 600; }
    .node--completed .node__marker {
      border-color: var(--lw-eval-correct);
      background: var(--lw-eval-correct);
      color: var(--lw-on-color);
    }
    .node--review .node__marker {
      border-color: var(--lw-eval-wrong);
      color: var(--lw-eval-wrong);
      background: var(--lw-eval-wrong-bg);
      animation: lw-crystal-alarm 2s var(--lw-ease) infinite;
    }
    .node--locked .node__marker { background: var(--lw-paper-sunken); }

    .node__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .node__title {
      font-family: var(--lw-font-ui);
      font-size: var(--lw-text-sm);
      font-weight: 450;
      line-height: 1.35;
      color: var(--lw-ink);
    }
    .node--locked .node__title { color: var(--lw-ink-muted); }
    .node__meta {
      display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap;
      font-family: var(--lw-font-mono); font-size: 10.5px; color: var(--lw-ink-faint);
    }
    .node__sep { color: var(--lw-rule-strong); }

    .node__crystal, .node__go { flex-shrink: 0; }
    .node__go {
      color: var(--lw-ink-faint);
      opacity: 0; transform: translateX(-4px);
      transition: opacity var(--lw-dur-fast) var(--lw-ease), transform var(--lw-dur-fast) var(--lw-ease);
    }

    @media (max-width: 620px) {
      .topic__progress { display: none; }
      .topic__title { font-size: var(--lw-text-h3); }
    }
  `],
})
export class TrailMap implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly trail = signal<Trail | null>(null);

  private subtopicTitles = new Map<string, string>();

  prereqTitle(sub: SubtopicNode): string {
    return (sub.prerequisiteSubtopicId && this.subtopicTitles.get(sub.prerequisiteSubtopicId)) || 'o subtópico anterior';
  }

  open(lesson: LessonNode, sub: SubtopicNode): void {
    if (sub.locked) return;
    if (lesson.status === 'LOCKED') {
      this.toast.info('Lição bloqueada', 'Complete a lição anterior para chegar aqui.');
      return;
    }
    this.router.navigate(['/licao', lesson.id]);
  }

  async ngOnInit(): Promise<void> {
    try {
      const trail = await firstValueFrom(this.api.trail());
      this.trail.set(trail);
      for (const topic of trail.topics) {
        for (const sub of topic.subtopics) this.subtopicTitles.set(sub.id, sub.title);
      }
      // rolagem até a trilha vinda do dashboard (?#slug)
      const fragment = this.route.snapshot.fragment;
      if (fragment) {
        setTimeout(() => document.getElementById(fragment)?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar a trilha.');
    } finally {
      this.loading.set(false);
    }
  }
}
