import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Achievement, Profile, QuestionType } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Avatar, ProgressBar } from '../../shared/widgets';

/**
 * Rampa sequencial de UM matiz (o terracota da marca) sobre o papel — o
 * tratamento correto para um heatmap. O nível 0 ("sem atividade") é o papel
 * rebaixado. Degraus ordinais ≥1.25 entre vizinhos e topo ≥3:1 contra o card,
 * validados em scratchpad/contrast-editorial.js. Espelha --lw-ramp-0..4.
 */
const HEAT_RAMP = ['#f1eee6', '#ebcdb8', '#d99a6e', '#bf6338', '#8e3620'];
const WEEKDAY_LABELS = ['', 'seg', '', 'qua', '', 'sex', ''];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Múltipla escolha',
  DESCRIPTIVE: 'Descritivas',
  CODE_CHALLENGE: 'Desafios de código',
};

interface HeatCell { date: string; minutes: number; color: string; tip: string; }
interface HeatWeek { monthLabel: string; cells: (HeatCell | null)[]; }
interface XpChart {
  path: string; area: string;
  points: { x: number; y: number; xp: number; label: string }[];
  ticks: { y: number; label: string }[];
  maxXp: number;
}

const CHART_W = 600;
const CHART_H = 200;
const PAD_L = 40;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 24;

@Component({
  selector: 'lw-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Icon, Avatar, ProgressBar],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="skeleton" style="height: 120px; margin-bottom: 16px"></div>
        <div class="skeleton" style="height: 110px; margin-bottom: 16px"></div>
        <div class="skeleton" style="height: 420px"></div>
      } @else if (profile(); as p) {
        <!-- cabeçalho: a ficha do leitor -->
        <header class="who anim-fade-up">
          <lw-avatar [name]="p.user.username" [url]="p.user.avatarUrl" [size]="76" />
          <div class="who__info">
            <span class="lw-label">Perfil</span>
            <h1>{{ p.user.username }}</h1>
            <p class="who__email">{{ p.user.email }}</p>
            <div class="who__level">
              <span class="chip"><lw-icon name="zap" [size]="13" /> Nível {{ p.user.level }}</span>
              <div class="who__bar">
                <lw-progress [value]="xpPercent()" [height]="5" />
                <span class="muted">{{ p.user.xpIntoLevel }}/{{ p.user.xpForNextLevel }} XP para o nível {{ p.user.level + 1 }}</span>
              </div>
            </div>
          </div>
          <div class="who__streak" title="Dias consecutivos de estudo">
            <lw-icon name="flame" [size]="20" />
            <b class="numeral">{{ p.user.streakDays }}</b>
            <span>streak</span>
          </div>
        </header>

        <!-- tiles -->
        <div class="tiles anim-fade-up">
          <div class="tile">
            <span class="tile__label">Tempo total de estudo</span>
            <span class="tile__value numeral">{{ hoursLabel(p.totalStudyMinutes) }}</span>
          </div>
          <div class="tile">
            <span class="tile__label">Lições concluídas</span>
            <span class="tile__value numeral">{{ p.lessonsCompleted }}</span>
          </div>
          <div class="tile">
            <span class="tile__label">Conquistas</span>
            <span class="tile__value numeral">{{ p.achievementsEarned }}</span>
          </div>
          <div class="tile">
            <span class="tile__label">Taxa de acerto geral</span>
            <span class="tile__value numeral">{{ overallAccuracy() }}%</span>
          </div>
        </div>

        <div class="grid">
          <!-- heatmap -->
          <section class="card anim-fade-up span-2">
            <h3 class="block-title">Atividade — últimas 12 semanas</h3>
            <div class="heat">
              <div class="heat__weekdays">
                @for (label of weekdayLabels; track $index) { <span>{{ label }}</span> }
              </div>
              <div class="heat__scroll">
                <div class="heat__months">
                  @for (week of heatWeeks(); track $index) { <span>{{ week.monthLabel }}</span> }
                </div>
                <div class="heat__grid">
                  @for (week of heatWeeks(); track $index) {
                    <div class="heat__col">
                      @for (cell of week.cells; track $index) {
                        @if (cell) {
                          <span class="heat__cell" [style.background]="cell.color" [attr.data-tip]="cell.tip"></span>
                        } @else {
                          <span class="heat__cell heat__cell--void"></span>
                        }
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="heat__legend">
              <span class="muted">menos</span>
              @for (color of heatRamp(); track $index) { <span class="heat__cell" [style.background]="color"></span> }
              <span class="muted">mais</span>
            </div>
          </section>

          <!-- xp ao longo do tempo -->
          <section class="card anim-fade-up span-2">
            <h3 class="block-title">XP ganho por dia — últimos 30 dias</h3>
            @if (xpChart(); as chart) {
              <div class="xpchart" (mousemove)="onChartMove($event)" (mouseleave)="hoverIndex.set(null)">
                <svg [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" preserveAspectRatio="none" class="xpchart__svg" role="img"
                     aria-label="Gráfico de XP ganho por dia nos últimos 30 dias">
                  @for (tick of chart.ticks; track tick.y) {
                    <line [attr.x1]="padL" [attr.x2]="chartW - padR" [attr.y1]="tick.y" [attr.y2]="tick.y"
                          class="xpchart__grid" stroke-width="1" vector-effect="non-scaling-stroke" />
                    <text [attr.x]="padL - 8" [attr.y]="tick.y + 4" text-anchor="end" class="xpchart__tick">{{ tick.label }}</text>
                  }
                  <path [attr.d]="chart.area" class="xpchart__area" />
                  <path [attr.d]="chart.path" fill="none" class="xpchart__line" stroke-width="2"
                        stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
                  @if (hoverPoint(); as hp) {
                    <line [attr.x1]="hp.x" [attr.x2]="hp.x" [attr.y1]="padT" [attr.y2]="chartH - padB"
                          class="xpchart__crosshair" stroke-width="1" vector-effect="non-scaling-stroke" />
                    <circle [attr.cx]="hp.x" [attr.cy]="hp.y" r="6" class="xpchart__dot" stroke-width="2" />
                  } @else if (chart.points.length > 0) {
                    <circle [attr.cx]="chart.points[chart.points.length - 1].x"
                            [attr.cy]="chart.points[chart.points.length - 1].y"
                            r="5" class="xpchart__dot" stroke-width="2" />
                  }
                </svg>
                @if (hoverPoint(); as hp) {
                  <div class="xpchart__tooltip" [style.left]="(hp.x / chartW * 100) + '%'">
                    <b>{{ hp.xp }} XP</b><span class="muted">{{ hp.label }}</span>
                  </div>
                }
              </div>
            }
          </section>

          <!-- taxa de acerto por tipo -->
          <section class="card anim-fade-up">
            <h3 class="block-title">Taxa de acerto por tipo de questão</h3>
            @if (p.accuracyByType.length === 0) { <p class="muted">Responda questões para ver suas estatísticas.</p> }
            @for (acc of p.accuracyByType; track acc.type) {
              <div class="acc">
                <div class="acc__head">
                  <span>{{ typeLabel(acc.type) }}</span>
                  <span class="mono">{{ acc.accuracyPercent }}% <small class="muted">({{ acc.correct }}/{{ acc.total }})</small></span>
                </div>
                <div class="acc__meter"><div class="acc__fill" [style.width.%]="acc.accuracyPercent"></div></div>
              </div>
            }
          </section>

          <!-- distribuição por trilha -->
          <section class="card anim-fade-up">
            <h3 class="block-title">Lições por trilha</h3>
            @for (topic of p.lessonsByTopic; track topic.topicTitle) {
              @if (topic.total > 0) {
                <div class="acc">
                  <div class="acc__head">
                    <span class="acc__topic"><i class="dot"></i>{{ topic.topicTitle }}</span>
                    <span class="mono">{{ topic.completed }}/{{ topic.total }}</span>
                  </div>
                  <div class="acc__meter">
                    <div class="acc__fill" [style.width.%]="topic.total > 0 ? (topic.completed / topic.total) * 100 : 0"></div>
                  </div>
                </div>
              }
            }
          </section>

          <!-- conquistas -->
          <section class="card anim-fade-up span-2">
            <h3 class="block-title">Conquistas</h3>
            <div class="badges">
              @for (a of achievements(); track a.id) {
                <div class="badge" [class.badge--locked]="!a.earned"
                     [attr.data-tip]="a.description + (a.earned && a.earnedAt ? '' : ' · +' + a.xpBonus + ' XP')">
                  <span class="badge__icon"><lw-icon [name]="a.icon ?? 'trophy'" [size]="24" /></span>
                  <strong>{{ a.title }}</strong>
                  @if (a.earned) {
                    <span class="muted">{{ a.earnedAt | date: 'dd/MM/yy' }}</span>
                  } @else {
                    <span class="muted"><lw-icon name="lock" [size]="11" /> bloqueada</span>
                  }
                </div>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ---- ficha do leitor ---- */
    .who {
      display: flex; gap: var(--lw-space-xl); align-items: center;
      padding-bottom: var(--lw-space-xl);
      border-bottom: 2px solid var(--lw-ink);
      margin-bottom: var(--lw-space-xl);
    }
    .who__info { flex: 1; min-width: 0; }
    .who__info h1 {
      font-size: var(--lw-text-h1);
      letter-spacing: var(--lw-tracking-display);
      margin: 3px 0 2px;
    }
    .who__email { font-family: var(--lw-font-mono); font-size: 11.5px; color: var(--lw-ink-faint); margin-bottom: var(--lw-space-md); }
    .who__level { display: flex; align-items: center; gap: var(--lw-space-md); }
    .who__bar {
      flex: 1; max-width: 380px;
      display: flex; flex-direction: column; gap: 5px;
      .muted { font-size: 11.5px; }
    }
    .who__streak {
      display: flex; flex-direction: column; align-items: center; gap: 1px;
      padding-left: var(--lw-space-xl);
      border-left: 1px solid var(--lw-rule);
      color: var(--lw-streak);
      b { font-size: 38px; font-weight: 500; line-height: 1; }
      span {
        font-family: var(--lw-font-mono); font-size: 10px;
        text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
        color: var(--lw-ink-faint);
      }
    }

    /* ---- faixa de números ---- */
    .tiles {
      display: grid; grid-template-columns: repeat(4, 1fr);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-2xl);
    }
    .tile { display: flex; flex-direction: column; gap: 5px; padding: 0 var(--lw-space-lg) var(--lw-space-lg) 0; }
    .tile + .tile { padding-left: var(--lw-space-lg); border-left: 1px solid var(--lw-rule-hair); }
    .tile__label {
      font-family: var(--lw-font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
      color: var(--lw-ink-faint);
    }
    .tile__value { font-size: 30px; font-weight: 500; line-height: 1.05; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--lw-space-lg); }
    .span-2 { grid-column: span 2; }
    .block-title {
      font-size: var(--lw-text-h3); font-weight: 600;
      padding-bottom: var(--lw-space-sm);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-lg);
    }

    /* ---- heatmap ---- */
    .heat { display: flex; gap: var(--lw-space-sm); }
    .heat__weekdays {
      display: flex; flex-direction: column; gap: 3px;
      padding-top: 20px;
      span { height: 13px; font-family: var(--lw-font-mono); font-size: 9px; color: var(--lw-ink-faint); line-height: 13px; }
    }
    .heat__scroll { overflow-x: auto; flex: 1; }
    .heat__months {
      display: flex; gap: 3px; height: 16px; margin-bottom: 4px;
      span { width: 13px; flex-shrink: 0; font-family: var(--lw-font-mono); font-size: 9px; color: var(--lw-ink-faint); overflow: visible; white-space: nowrap; text-transform: uppercase; }
    }
    .heat__grid { display: flex; gap: 3px; }
    .heat__col { display: flex; flex-direction: column; gap: 3px; }
    .heat__cell {
      width: 13px; height: 13px;
      border-radius: 2px;
      position: relative;
      flex-shrink: 0;
    }
    .heat__cell--void { background: transparent; }
    .heat__cell[data-tip]:hover::after {
      content: attr(data-tip);
      position: absolute;
      bottom: calc(100% + 6px);
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
      z-index: 10;
    }
    .heat__legend {
      display: flex; align-items: center; gap: 4px;
      margin-top: var(--lw-space-md);
      justify-content: flex-end;
      .muted { font-family: var(--lw-font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: var(--lw-tracking-micro); }
    }

    /* ---- gráfico de XP ---- */
    .xpchart { position: relative; }
    .xpchart__svg { width: 100%; height: auto; display: block; }
    .xpchart__tick { font-size: 10px; fill: var(--lw-ink-faint); font-family: var(--lw-font-mono); }
    .xpchart__grid { stroke: var(--lw-rule-hair); }
    .xpchart__area { fill: var(--lw-accent-wash); }
    .xpchart__line { stroke: var(--lw-accent); }
    .xpchart__crosshair { stroke: var(--lw-rule-strong); }
    .xpchart__dot { fill: var(--lw-accent); stroke: var(--lw-paper-raised); }
    .xpchart__tooltip {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      box-shadow: var(--lw-lift-sm);
      border-radius: var(--lw-radius-sm);
      padding: 4px 10px;
      display: flex; flex-direction: column; align-items: center;
      font-size: 11px;
      pointer-events: none;
      white-space: nowrap;
      b { font-size: 13px; font-family: var(--lw-font-mono); color: var(--lw-accent-deep); }
      .muted { font-size: 10px; }
    }

    /* ---- medidores ---- */
    .acc { margin-bottom: var(--lw-space-lg); }
    .acc:last-child { margin-bottom: 0; }
    .acc__head {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: 13.5px; margin-bottom: 6px;
      small { font-size: 11px; }
      .mono { font-size: 12px; }
    }
    .acc__topic { display: flex; align-items: center; gap: var(--lw-space-sm); }
    .dot { width: 6px; height: 6px; border-radius: 999px; display: inline-block; background: var(--lw-ink-faint); }
    .acc__meter {
      height: 5px;
      background: var(--lw-paper-deep);
      border-radius: 999px;
      overflow: hidden;
    }
    .acc__fill {
      height: 100%; background: var(--lw-ink); border-radius: 999px;
      transition: width var(--lw-dur-slow) var(--lw-ease-out);
    }

    /* ---- conquistas: selos ---- */
    .badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(146px, 1fr)); gap: var(--lw-space-md); }
    .badge {
      position: relative;
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      text-align: center;
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-radius: var(--lw-radius);
      padding: var(--lw-space-lg) var(--lw-space-sm);
      transition: border-color var(--lw-dur-fast) var(--lw-ease);
      strong {
        font-family: var(--lw-font-display);
        font-variation-settings: var(--lw-display-variation);
        font-size: 14px; font-weight: 600; line-height: 1.25;
      }
      .muted { font-family: var(--lw-font-mono); font-size: 9.5px; display: inline-flex; align-items: center; gap: 4px; }
      &:hover { border-color: var(--lw-ink-faint); }
    }
    .badge__icon {
      width: 46px; height: 46px;
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      background: var(--lw-accent-wash); color: var(--lw-accent);
      border: 1px solid var(--lw-accent-edge);
    }
    .badge--locked {
      opacity: 0.55;
      background: var(--lw-paper);
    }
    .badge--locked .badge__icon {
      background: var(--lw-paper-sunken);
      border-color: var(--lw-rule);
      color: var(--lw-ink-faint);
    }
    .badge[data-tip]:hover::after {
      content: attr(data-tip);
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
      max-width: 220px;
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      box-shadow: var(--lw-lift);
      border-radius: var(--lw-radius-sm);
      padding: 6px 10px;
      font-size: 11px;
      line-height: 1.45;
      text-align: left;
      z-index: 10;
    }

    @media (max-width: 860px) {
      .tiles { grid-template-columns: 1fr 1fr; }
      .tile { padding-bottom: var(--lw-space-md); }
      .tile:nth-child(odd) { padding-left: 0; border-left: none; }
      .tile:nth-child(n + 3) { padding-top: var(--lw-space-md); border-top: 1px solid var(--lw-rule-hair); }
      .grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .who { flex-direction: column; text-align: center; gap: var(--lw-space-lg); }
      .who__streak { padding-left: 0; border-left: none; flex-direction: row; align-items: baseline; gap: var(--lw-space-sm); }
      .who__level { flex-direction: column; align-items: stretch; }
    }
  `],
})
export class ProfilePage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly heatRamp = () => HEAT_RAMP;
  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly chartW = CHART_W;
  readonly chartH = CHART_H;
  readonly padL = PAD_L;
  readonly padR = PAD_R;
  readonly padT = PAD_T;
  readonly padB = PAD_B;

  readonly loading = signal(true);
  readonly profile = signal<Profile | null>(null);
  readonly achievements = signal<Achievement[]>([]);
  readonly hoverIndex = signal<number | null>(null);

  readonly xpPercent = computed(() => {
    const u = this.profile()?.user;
    return u && u.xpForNextLevel > 0 ? (u.xpIntoLevel / u.xpForNextLevel) * 100 : 0;
  });

  readonly overallAccuracy = computed(() => {
    const acc = this.profile()?.accuracyByType ?? [];
    const total = acc.reduce((sum, a) => sum + a.total, 0);
    const correct = acc.reduce((sum, a) => sum + a.correct, 0);
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  });

  /** Grade do heatmap: 12 semanas em colunas, dom→sáb nas linhas. */
  readonly heatWeeks = computed<HeatWeek[]>(() => {
    const ramp = this.heatRamp();
    const byDate = new Map((this.profile()?.studyHeatmap ?? []).map(d => [d.date, d.minutes]));
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 83);
    start.setDate(start.getDate() - start.getDay()); // volta até domingo

    const weeks: HeatWeek[] = [];
    let lastMonth = -1;
    const cursor = new Date(start);
    while (cursor <= today) {
      const cells: (HeatCell | null)[] = [];
      let monthLabel = '';
      for (let dow = 0; dow < 7; dow++) {
        if (cursor > today) { cells.push(null); continue; }
        const iso = toIso(cursor);
        const minutes = byDate.get(iso) ?? 0;
        if (dow === 0 && cursor.getMonth() !== lastMonth) {
          lastMonth = cursor.getMonth();
          monthLabel = MONTHS[lastMonth];
        }
        cells.push({
          date: iso,
          minutes,
          color: ramp[heatLevel(minutes)],
          tip: `${minutes} min · ${cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push({ monthLabel, cells });
    }
    return weeks;
  });

  /** Série contínua de 30 dias (dias sem evento = 0 XP). */
  readonly xpChart = computed<XpChart | null>(() => {
    const p = this.profile();
    if (!p) return null;
    const byDate = new Map(p.xpHistory.map(e => [e.date, e.xp]));
    const today = new Date();
    const days: { xp: number; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        xp: byDate.get(toIso(d)) ?? 0,
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      });
    }

    const maxRaw = Math.max(10, ...days.map(d => d.xp));
    const maxXp = niceCeil(maxRaw);
    const innerW = CHART_W - PAD_L - PAD_R;
    const innerH = CHART_H - PAD_T - PAD_B;

    const points = days.map((d, i) => ({
      x: PAD_L + (i / (days.length - 1)) * innerW,
      y: PAD_T + innerH - (d.xp / maxXp) * innerH,
      xp: d.xp,
      label: d.label,
    }));

    const path = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
    const baseline = PAD_T + innerH;
    const area = `${path} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`;

    const ticks = [0, 0.5, 1].map(f => ({
      y: PAD_T + innerH - f * innerH,
      label: `${Math.round(maxXp * f)}`,
    }));

    return { path, area, points, ticks, maxXp };
  });

  readonly hoverPoint = computed(() => {
    const idx = this.hoverIndex();
    const chart = this.xpChart();
    if (idx === null || !chart) return null;
    return chart.points[Math.max(0, Math.min(chart.points.length - 1, idx))] ?? null;
  });

  typeLabel(type: QuestionType): string {
    return TYPE_LABELS[type] ?? type;
  }

  hoursLabel(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  onChartMove(event: MouseEvent): void {
    const chart = this.xpChart();
    if (!chart) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const xView = ((event.clientX - rect.left) / rect.width) * CHART_W;
    const innerW = CHART_W - PAD_L - PAD_R;
    const frac = (xView - PAD_L) / innerW;
    this.hoverIndex.set(Math.round(frac * (chart.points.length - 1)));
  }

  async ngOnInit(): Promise<void> {
    try {
      const [profile, achievements] = await Promise.all([
        firstValueFrom(this.api.profile()),
        firstValueFrom(this.api.achievements()),
      ]);
      this.profile.set(profile);
      this.achievements.set(achievements);
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar o perfil.');
    } finally {
      this.loading.set(false);
    }
  }
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function heatLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

/** Arredonda o teto do eixo para um número "limpo". */
function niceCeil(value: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const unit = value / pow;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return nice * pow;
}
