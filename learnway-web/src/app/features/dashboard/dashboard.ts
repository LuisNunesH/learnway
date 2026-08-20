import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { LeaderboardEntry, LessonNode, ReviewStats, SessionStats, Trail } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Avatar, CountUp, Crystal, ProgressBar } from '../../shared/widgets';

interface NextLesson { lesson: LessonNode; topicTitle: string; subtopicTitle: string; }

/** 95 → "1h 35min"; 45 → "45min". */
function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

@Component({
  selector: 'lw-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Avatar, CountUp, Crystal, ProgressBar],
  template: `
    <div class="page">
      <header class="page-head">
        <span class="lw-label">Painel · {{ todayLabel() }}</span>
        <h1 class="page-title">{{ greeting() }}, {{ user()?.username }}</h1>
        <p class="page-subtitle">Pronto para mais um dia de código?</p>
      </header>

      @if (loading()) {
        <div class="band">
          @for (i of [1, 2, 3, 4]; track i) { <div class="skeleton" style="height: 96px"></div> }
        </div>
      } @else {
        <!-- Faixa de leituras: quatro colunas separadas por fio, sem caixa. -->
        <div class="band anim-fade-up">
          <!-- streak -->
          <div class="readout">
            <span class="readout__label"><lw-icon name="flame" [size]="12" /> Streak de estudo</span>
            <span class="readout__value numeral"><lw-count [value]="user()?.streakDays ?? 0" /><small>dias</small></span>
            <span class="readout__note">seguidos estudando</span>
          </div>

          <!-- xp / nível -->
          <div class="readout">
            <span class="readout__label"><lw-icon name="zap" [size]="12" /> Experiência</span>
            <span class="readout__value numeral"><lw-count [value]="user()?.xpTotal ?? 0" [duration]="1100" /><small>XP</small></span>
            <span class="readout__note">Nível {{ user()?.level ?? 1 }} · faltam {{ xpMissing() }} XP</span>
            <lw-progress [value]="xpPercent()" [height]="4" />
          </div>

          <!-- cristais -->
          <a class="readout readout--link" routerLink="/revisoes"
             [class.readout--alert]="(reviewStats()?.overdue ?? 0) > 0">
            <span class="readout__label">
              <lw-crystal [urgency]="crystalUrgency()" [size]="13" /> Revisões
            </span>
            <span class="readout__value numeral"><lw-count [value]="reviewStats()?.crystalsToReview ?? 0" /></span>
            <span class="readout__note">
              @if ((reviewStats()?.crystalsToReview ?? 0) > 0) {
                {{ reviewStats()?.crystalsToReview === 1 ? 'cristal precisa' : 'cristais precisam' }} de você
              } @else { nada pendente por hoje }
            </span>
            <lw-icon name="arrow-right" [size]="15" class="readout__chev" />
          </a>

          <!-- meta diária -->
          <div class="readout">
            <span class="readout__label"><lw-icon name="target" [size]="12" /> Meta diária</span>
            <span class="readout__value numeral"><lw-count [value]="sessionStats()?.todayMinutes ?? 0" /><small>/{{ sessionStats()?.dailyGoalMinutes ?? 20 }} min</small></span>
            <span class="readout__note">tempo de estudo de hoje</span>
            <lw-progress [value]="goalPercent()" [height]="4" color="success" />
          </div>
        </div>

        <div class="columns">
          <div class="col-main">
            <!-- continuar: a chamada de capa -->
            @if (nextLesson(); as next) {
              <section class="feature anim-fade-up">
                <lw-icon name="gem" [size]="210" class="feature__art" aria-hidden="true" />
                <div class="feature__info">
                  <span class="lw-label feature__eyebrow"><lw-icon name="play" [size]="11" /> Continuar aprendendo</span>
                  <h2 class="feature__title">{{ next.lesson.title }}</h2>
                  <p class="feature__meta">
                    {{ next.topicTitle }} <span class="feature__sep">/</span>
                    {{ next.subtopicTitle }} <span class="feature__sep">/</span>
                    <b class="mono">+{{ next.lesson.xpReward }} XP</b>
                  </p>
                </div>
                <a class="btn btn--primary btn--lg feature__cta" [routerLink]="['/licao', next.lesson.id]">
                  Iniciar lição <lw-icon name="arrow-right" [size]="17" />
                </a>
              </section>
            }

            <!-- trilhas: sumário, não grade de cartões -->
            <section class="anim-fade-up">
              <div class="section-head">
                <h2>Suas trilhas</h2>
                <a routerLink="/trilha" class="see-all">Ver mapa completo <lw-icon name="arrow-right" [size]="13" /></a>
              </div>
              <div class="index">
                @for (topic of trail()?.topics ?? []; track topic.id) {
                  <a class="entry" routerLink="/trilha" [fragment]="topic.slug">
                    <lw-icon [name]="topic.icon ?? 'star'" [size]="17" class="entry__icon" />
                    <span class="entry__name">{{ topic.title }}</span>
                    @if (topic.totalLessons > 0) {
                      <span class="entry__bar">
                        <lw-progress [value]="(topic.completedLessons / topic.totalLessons) * 100" [height]="3" />
                      </span>
                      <span class="entry__count mono">{{ topic.completedLessons }}/{{ topic.totalLessons }}</span>
                    } @else {
                      <span class="chip entry__soon">Em breve</span>
                    }
                    <lw-icon name="arrow-right" [size]="14" class="entry__chev" />
                  </a>
                }
              </div>
            </section>
          </div>

          <div class="col-side">
            <!-- minutos da semana -->
            <section class="panel anim-fade-up">
              <h3 class="panel__title">Minutos de estudo</h3>
              <span class="lw-label">últimos 7 dias</span>
              <div class="week-chart" role="img" aria-label="Minutos de estudo por dia na última semana">
                @for (day of weekDays(); track day.date) {
                  <div class="week-chart__slot" [attr.data-tip]="day.tip">
                    <div class="week-chart__bar" [style.height.%]="day.pct" [class.week-chart__bar--today]="day.today"></div>
                    <span class="week-chart__label">{{ day.label }}</span>
                  </div>
                }
              </div>
              <p class="week-total">Total da semana <b class="numeral">{{ weekTotalLabel() }}</b></p>
            </section>

            <!-- mini ranking -->
            <section class="panel anim-fade-up">
              <div class="section-head section-head--tight">
                <h3 class="panel__title">Top da semana</h3>
                <a routerLink="/ranking" class="see-all">Ranking <lw-icon name="arrow-right" [size]="13" /></a>
              </div>
              @if (top3().length === 0) {
                <p class="muted">Ninguém pontuou ainda — seja o primeiro!</p>
              }
              @for (entry of top3(); track entry.userId) {
                <div class="rank-row" [class.rank-row--me]="entry.currentUser">
                  <span class="rank-row__pos numeral" [class.rank-row__pos--top]="entry.rank === 1">{{ entry.rank }}</span>
                  <lw-avatar [name]="entry.username" [url]="entry.avatarUrl" [size]="28" />
                  <span class="rank-row__name">{{ entry.username }} @if (entry.topOfWeek) { <lw-icon name="crown" [size]="13" /> }</span>
                  <span class="rank-row__xp mono">{{ entry.xpThisWeek }}</span>
                </div>
              }
            </section>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ---- faixa de leituras: colunas separadas por fio, sem caixa ---- */
    .band {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--lw-rule);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-2xl);
    }
    .band > .skeleton { border: none; border-radius: 0; margin: var(--lw-space-lg) 0; }

    .readout {
      position: relative;
      display: flex; flex-direction: column; gap: 5px;
      padding: var(--lw-space-lg) var(--lw-space-lg) var(--lw-space-lg) 0;
      min-width: 0;
    }
    .readout + .readout { padding-left: var(--lw-space-lg); border-left: 1px solid var(--lw-rule-hair); }

    .readout__label {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--lw-font-mono);
      font-size: 10.5px;
      letter-spacing: var(--lw-tracking-micro);
      text-transform: uppercase;
      color: var(--lw-ink-faint);
    }
    .readout__value {
      font-size: 40px;
      font-weight: 500;
      line-height: 1;
      color: var(--lw-ink);
      display: flex; align-items: baseline; gap: 6px;
    }
    .readout__value small {
      font-family: var(--lw-font-ui);
      font-size: 12px;
      font-weight: 450;
      letter-spacing: 0;
      color: var(--lw-ink-muted);
    }
    .readout__note { font-size: 12.5px; color: var(--lw-ink-muted); }
    .readout lw-progress { margin-top: 3px; }

    .readout--link { cursor: pointer; transition: background var(--lw-dur-fast) var(--lw-ease); }
    .readout--link:hover { background: var(--lw-paper-sunken); }
    .readout--link:hover .readout__chev { opacity: 1; transform: translateX(0); }
    .readout--alert .readout__value { color: var(--lw-eval-wrong); }
    .readout__chev {
      position: absolute; right: var(--lw-space-md); top: var(--lw-space-lg);
      color: var(--lw-ink-faint);
      opacity: 0; transform: translateX(-4px);
      transition: opacity var(--lw-dur-fast) var(--lw-ease), transform var(--lw-dur-fast) var(--lw-ease);
    }

    .columns { display: grid; grid-template-columns: 1fr 320px; gap: var(--lw-space-2xl); align-items: start; }
    .col-main, .col-side { display: flex; flex-direction: column; gap: var(--lw-space-2xl); min-width: 0; }

    /* ---- chamada de capa ---- */
    .feature {
      position: relative;
      overflow: hidden;
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--lw-space-xl);
      padding: var(--lw-space-xl);
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-top: 3px solid var(--lw-accent);
      border-radius: var(--lw-radius);
    }
    .feature__art {
      position: absolute;
      right: -40px; bottom: -70px;
      color: var(--lw-ink);
      opacity: 0.035;
      transform: rotate(-10deg);
      pointer-events: none;
    }
    .feature__info, .feature__cta { position: relative; }
    .feature__info { display: flex; flex-direction: column; gap: var(--lw-space-sm); align-items: flex-start; min-width: 0; }
    .feature__eyebrow { display: inline-flex; align-items: center; gap: 5px; color: var(--lw-accent); }
    .feature__title { font-size: var(--lw-text-h2); font-weight: 600; }
    .feature__meta { font-size: 13.5px; color: var(--lw-ink-muted); }
    .feature__meta b { color: var(--lw-accent-deep); font-weight: 500; }
    .feature__sep { color: var(--lw-ink-faint); margin: 0 3px; }

    /* ---- cabeçalho de seção ---- */
    .section-head {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: var(--lw-space-md);
      padding-bottom: var(--lw-space-sm);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-xs);
    }
    .section-head h2 { font-size: var(--lw-text-h3); font-weight: 600; }
    .section-head--tight { margin-bottom: var(--lw-space-sm); }
    .see-all {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--lw-font-mono); font-size: 10.5px;
      letter-spacing: var(--lw-tracking-micro); text-transform: uppercase;
      color: var(--lw-ink-muted);
      white-space: nowrap;
      &:hover { color: var(--lw-accent-deep); }
    }

    /* ---- sumário de trilhas: linhas separadas por fio ---- */
    .index { display: flex; flex-direction: column; }
    .entry {
      display: flex; align-items: center; gap: var(--lw-space-md);
      padding: var(--lw-space-md) var(--lw-space-sm);
      border-bottom: 1px solid var(--lw-rule-hair);
      transition: background var(--lw-dur-fast) var(--lw-ease), padding-left var(--lw-dur-fast) var(--lw-ease);
      &:hover { background: var(--lw-paper-sunken); padding-left: var(--lw-space-md); }
      &:hover .entry__chev { opacity: 1; transform: translateX(0); }
    }
    .entry__icon { color: var(--lw-ink-faint); flex-shrink: 0; }
    .entry__name {
      flex: 1; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: var(--lw-text-sm); font-weight: 450;
    }
    .entry__bar { width: 84px; flex-shrink: 0; }
    .entry__count { font-size: 11.5px; color: var(--lw-ink-muted); width: 44px; text-align: right; flex-shrink: 0; }
    .entry__soon { flex-shrink: 0; }
    .entry__chev {
      color: var(--lw-ink-faint); flex-shrink: 0;
      opacity: 0; transform: translateX(-4px);
      transition: opacity var(--lw-dur-fast) var(--lw-ease), transform var(--lw-dur-fast) var(--lw-ease);
    }

    /* ---- painéis da coluna lateral ---- */
    .panel {
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-radius: var(--lw-radius);
      padding: var(--lw-space-lg);
    }
    .panel__title { font-size: var(--lw-text-h3); font-weight: 600; }
    .panel .lw-label { margin-top: 2px; }

    .week-chart {
      display: flex; align-items: flex-end; gap: 6px;
      height: 108px; margin-top: var(--lw-space-lg); padding-bottom: var(--lw-space-xs);
      border-bottom: 1px solid var(--lw-rule);
    }
    .week-chart__slot {
      position: relative;
      flex: 1;
      height: 100%;
      display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px;
      cursor: default;
    }
    .week-chart__slot:hover::after {
      content: attr(data-tip);
      position: absolute;
      bottom: calc(100% + 4px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      box-shadow: var(--lw-lift-sm);
      border-radius: var(--lw-radius-sm);
      padding: 3px 8px;
      font-family: var(--lw-font-mono);
      font-size: 10.5px;
      white-space: nowrap;
      z-index: 5;
    }
    .week-chart__bar {
      width: 100%;
      max-width: 20px;
      min-height: 3px;
      background: var(--lw-paper-deep);
      border-radius: 2px 2px 0 0;
      transition: height var(--lw-dur-slow) var(--lw-ease-out), background var(--lw-dur-fast) var(--lw-ease);
    }
    .week-chart__slot:hover .week-chart__bar { background: var(--lw-rule-strong); }
    .week-chart__bar--today,
    .week-chart__slot:hover .week-chart__bar--today { background: var(--lw-accent); }
    .week-chart__label {
      font-family: var(--lw-font-mono); font-size: 9.5px;
      letter-spacing: var(--lw-tracking-micro); text-transform: uppercase;
      color: var(--lw-ink-faint);
    }
    .week-total {
      display: flex; align-items: baseline; justify-content: space-between;
      font-size: 12.5px; color: var(--lw-ink-muted);
      margin-top: var(--lw-space-md);
    }
    .week-total b { color: var(--lw-ink); font-size: var(--lw-text-h3); font-weight: 500; }

    .rank-row {
      display: flex; align-items: center; gap: var(--lw-space-sm);
      padding: 7px 0;
      border-bottom: 1px solid var(--lw-rule-hair);
      font-size: 13.5px;
      &:last-child { border-bottom: none; }
    }
    .rank-row--me .rank-row__name { color: var(--lw-accent-deep); font-weight: 600; }
    .rank-row__pos {
      width: 22px; font-size: var(--lw-text-h3); font-weight: 500;
      color: var(--lw-ink-faint);
    }
    .rank-row__pos--top { color: var(--lw-ink); }
    .rank-row__name {
      flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-weight: 450; display: inline-flex; align-items: center; gap: 5px;
    }
    .rank-row__name lw-icon { color: var(--lw-eval-partial); flex-shrink: 0; }
    .rank-row__xp { color: var(--lw-ink-muted); font-size: 11.5px; }

    @media (max-width: 1040px) {
      .columns { grid-template-columns: 1fr; gap: var(--lw-space-xl); }
      .col-main, .col-side { gap: var(--lw-space-xl); }
    }
    @media (max-width: 860px) {
      .band { grid-template-columns: 1fr 1fr; }
      .readout { padding-left: var(--lw-space-lg); border-left: 1px solid var(--lw-rule-hair); }
      .readout:nth-child(odd) { padding-left: 0; border-left: none; }
      .readout:nth-child(n + 3) { border-top: 1px solid var(--lw-rule-hair); }
    }
    @media (max-width: 560px) {
      .band { grid-template-columns: 1fr; }
      .readout, .readout + .readout { padding-left: 0; border-left: none; }
      .readout + .readout { border-top: 1px solid var(--lw-rule-hair); }
      .readout__value { font-size: 34px; }
      .feature { flex-direction: column; align-items: stretch; }
      .feature__art { display: none; }
      .entry__bar { display: none; }
    }
  `],
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly user = this.auth.user;
  readonly loading = signal(true);
  readonly trail = signal<Trail | null>(null);
  readonly reviewStats = signal<ReviewStats | null>(null);
  readonly sessionStats = signal<SessionStats | null>(null);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);

  readonly top3 = computed(() => this.leaderboard().slice(0, 3));

  readonly xpPercent = computed(() => {
    const u = this.user();
    return u && u.xpForNextLevel > 0 ? (u.xpIntoLevel / u.xpForNextLevel) * 100 : 0;
  });

  readonly xpMissing = computed(() => {
    const u = this.user();
    return u ? Math.max(0, u.xpForNextLevel - u.xpIntoLevel) : 0;
  });

  readonly goalPercent = computed(() => {
    const s = this.sessionStats();
    if (!s || s.dailyGoalMinutes <= 0) return 0;
    return (s.todayMinutes / s.dailyGoalMinutes) * 100;
  });

  readonly crystalUrgency = computed(() => {
    const s = this.reviewStats();
    if (!s || s.crystalsToReview === 0) return undefined;
    return s.overdue > 0 ? 'OVERDUE' as const : 'DUE_TODAY' as const;
  });

  /** Primeira lição REVIEW ou AVAILABLE do mapa — o "continuar de onde parou". */
  readonly nextLesson = computed<NextLesson | null>(() => {
    const trail = this.trail();
    if (!trail) return null;
    let available: NextLesson | null = null;
    for (const topic of trail.topics) {
      for (const sub of topic.subtopics) {
        if (sub.locked) continue;
        for (const lesson of sub.lessons) {
          if (lesson.status === 'REVIEW') {
            return { lesson, topicTitle: topic.title, subtopicTitle: sub.title };
          }
          if (lesson.status === 'AVAILABLE' && !available) {
            available = { lesson, topicTitle: topic.title, subtopicTitle: sub.title };
          }
        }
      }
    }
    return available;
  });

  readonly weekDays = computed(() => {
    const stats = this.sessionStats();
    const byDate = new Map((stats?.weekly ?? []).map(d => [d.date, d.minutes]));
    const labels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const days: { date: string; label: string; minutes: number; pct: number; today: boolean; tip: string }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = toIso(d);
      const minutes = byDate.get(iso) ?? 0;
      days.push({
        date: iso,
        label: labels[d.getDay()],
        minutes,
        pct: 0,
        today: i === 0,
        tip: formatMinutes(minutes),
      });
    }
    const max = Math.max(15, ...days.map(d => d.minutes));
    for (const day of days) day.pct = Math.max(day.minutes > 0 ? 4 : 2, (day.minutes / max) * 100);
    return days;
  });

  readonly weekTotalLabel = computed(() => formatMinutes(this.sessionStats()?.weekMinutes ?? 0));

  /** Data por extenso na linha de olho — o "carimbo" da edição do dia. */
  readonly todayLabel = computed(() =>
    new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
  );

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Boa madrugada';
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  async ngOnInit(): Promise<void> {
    try {
      const [trail, reviews, sessions, board] = await Promise.all([
        firstValueFrom(this.api.trail()),
        firstValueFrom(this.api.reviewStats()),
        firstValueFrom(this.api.sessionStats()),
        firstValueFrom(this.api.weeklyLeaderboard()),
      ]);
      this.trail.set(trail);
      this.reviewStats.set(reviews);
      this.sessionStats.set(sessions);
      this.leaderboard.set(board);
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar o dashboard.');
    } finally {
      this.loading.set(false);
    }
  }
}

/** Data local em yyyy-MM-dd — toISOString() daria o dia em UTC (à noite, o de amanhã). */
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
