import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { CalendarDay } from '../../core/models';
import { Icon } from '../../shared/icon';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

interface DayCell {
  dayNumber: number;
  loggedIn: boolean;
  activities: number;
  today: boolean;
  future: boolean;
  tip: string;
}

@Component({
  selector: 'lw-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="page">
      <header class="page-head">
        <span class="lw-label">Diário</span>
        <h1 class="page-title">Calendário</h1>
        <p class="page-subtitle">Sua presença e atividades dia a dia — cada quadradinho conta uma história.</p>
      </header>

      <section class="cal anim-fade-up">
        <header class="cal__head">
          <button class="btn btn--ghost btn--sm" (click)="shiftMonth(-1)" aria-label="Mês anterior">
            <lw-icon name="chevron-left" [size]="16" />
          </button>
          <h2 class="cal__month">{{ monthLabel() }}</h2>
          <button class="btn btn--ghost btn--sm" (click)="shiftMonth(1)"
                  [disabled]="isCurrentMonth()" aria-label="Próximo mês">
            <lw-icon name="chevron-right" [size]="16" />
          </button>
        </header>

        <div class="cal__summary">
          <span class="chip chip--success"><lw-icon name="check" [size]="13" /> {{ activeDays() }} {{ activeDays() === 1 ? 'dia com acesso' : 'dias com acesso' }}</span>
          <span class="chip"><lw-icon name="zap" [size]="13" /> {{ totalActivities() }} {{ totalActivities() === 1 ? 'atividade no mês' : 'atividades no mês' }}</span>
        </div>

        @if (loading()) {
          <div class="skeleton" style="height: 320px"></div>
        } @else {
          <div class="cal__grid" role="grid" aria-label="Calendário mensal de atividades">
            @for (dow of weekdays; track dow) { <span class="cal__dow">{{ dow }}</span> }
            @for (blank of leadingBlanks(); track $index) { <span class="cal__cell cal__cell--void"></span> }
            @for (day of cells(); track day.dayNumber) {
              <div class="cal__cell"
                   [class.cal__cell--future]="day.future"
                   [class.cal__cell--logged]="day.loggedIn"
                   [class.cal__cell--active]="day.activities > 0"
                   [class.cal__cell--today]="day.today"
                   [attr.data-tip]="day.future ? null : day.tip">
                <span class="cal__num">{{ day.dayNumber }}</span>
                @if (day.activities > 0) {
                  <span class="cal__count">{{ day.activities }}</span>
                } @else if (day.loggedIn) {
                  <span class="cal__dot" title="Entrou no app"></span>
                }
              </div>
            }
          </div>

          <footer class="cal__legend">
            <span class="cal__legend-item"><span class="cal__dot"></span> entrou no app</span>
            <span class="cal__legend-item"><span class="cal__count cal__count--demo">n</span> nº de atividades (questões + revisões)</span>
            <span class="cal__legend-item"><span class="cal__swatch cal__swatch--today"></span> hoje</span>
          </footer>
        }
      </section>
    </div>
  `,
  styles: [`
    .cal { max-width: 720px; margin: 0 auto; }

    .cal__head {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: var(--lw-space-md);
      border-bottom: 2px solid var(--lw-ink);
      margin-bottom: var(--lw-space-md);
    }
    .cal__month { font-size: var(--lw-text-h2); font-weight: 600; }

    .cal__summary { display: flex; gap: var(--lw-space-sm); flex-wrap: wrap; margin-bottom: var(--lw-space-xl); }

    /* Folhinha de parede: casas separadas por fio, sem cartão em cada dia. */
    .cal__grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-top: 1px solid var(--lw-rule);
      border-left: 1px solid var(--lw-rule);
    }
    .cal__dow {
      text-align: center;
      font-family: var(--lw-font-mono);
      font-size: 9.5px;
      color: var(--lw-ink-faint);
      padding: 7px 0;
      text-transform: uppercase;
      letter-spacing: var(--lw-tracking-micro);
      border-right: 1px solid var(--lw-rule);
      border-bottom: 1px solid var(--lw-rule);
      background: var(--lw-paper-sunken);
    }
    .cal__cell {
      position: relative;
      aspect-ratio: 1;
      border-right: 1px solid var(--lw-rule);
      border-bottom: 1px solid var(--lw-rule);
      background: var(--lw-paper-raised);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
      transition: background var(--lw-dur-fast) var(--lw-ease);
    }
    .cal__cell--void { background: var(--lw-paper); }
    .cal__cell--future {
      background: repeating-linear-gradient(
        45deg,
        transparent, transparent 5px,
        var(--lw-rule-hair) 5px, var(--lw-rule-hair) 6px
      );
      .cal__num { color: var(--lw-ink-faint); }
    }
    .cal__cell--logged { background: var(--lw-eval-correct-bg); }
    .cal__cell--active { background: var(--lw-accent-wash); }
    .cal__cell--today {
      outline: 2px solid var(--lw-ink);
      outline-offset: -2px;
      z-index: 1;
    }

    .cal__num {
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-variant-numeric: tabular-nums;
      font-size: 15px; font-weight: 500; line-height: 1;
    }
    .cal__dot {
      width: 5px; height: 5px; border-radius: 999px;
      background: var(--lw-eval-correct);
      flex-shrink: 0;
    }
    .cal__count {
      min-width: 19px; height: 19px;
      padding: 0 5px;
      border-radius: 999px;
      background: var(--lw-accent);
      color: var(--lw-on-color);
      font-family: var(--lw-font-mono);
      font-size: 10.5px; font-weight: 500;
      display: inline-flex; align-items: center; justify-content: center;
      line-height: 1;
    }

    .cal__cell[data-tip]:hover::after {
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
      z-index: 10;
    }

    .cal__legend {
      display: flex; gap: var(--lw-space-xl); flex-wrap: wrap;
      padding-top: var(--lw-space-md);
      margin-top: var(--lw-space-md);
      border-top: 1px solid var(--lw-rule-hair);
      font-size: 11.5px;
      color: var(--lw-ink-muted);
    }
    .cal__legend-item { display: inline-flex; align-items: center; gap: 7px; }
    .cal__count--demo { font-size: 9.5px; }
    .cal__swatch--today {
      width: 14px; height: 14px; border-radius: 2px;
      background: var(--lw-paper-sunken);
      outline: 2px solid var(--lw-ink); outline-offset: -2px;
    }

    @media (max-width: 560px) {
      .cal__num { font-size: 13px; }
      .cal__count { min-width: 16px; height: 16px; font-size: 9.5px; }
      .cal__legend { gap: var(--lw-space-md); }
    }
  `],
})
export class CalendarPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly weekdays = WEEKDAYS;
  readonly loading = signal(true);
  readonly year = signal(new Date().getFullYear());
  readonly month = signal(new Date().getMonth() + 1); // 1–12
  readonly days = signal<CalendarDay[]>([]);

  readonly monthLabel = computed(() => `${MONTH_NAMES[this.month() - 1]} ${this.year()}`);

  readonly isCurrentMonth = computed(() => {
    const now = new Date();
    return this.year() === now.getFullYear() && this.month() === now.getMonth() + 1;
  });

  /** Casas vazias antes do dia 1 (semana começa no domingo). */
  readonly leadingBlanks = computed(() =>
    Array.from({ length: new Date(this.year(), this.month() - 1, 1).getDay() }));

  readonly cells = computed<DayCell[]>(() => {
    const todayIso = localIso(new Date());
    return this.days().map((d, i) => {
      const future = d.date > todayIso;
      const tip = d.activities > 0
        ? `${d.activities} ${d.activities === 1 ? 'atividade' : 'atividades'}`
        : d.loggedIn ? 'Entrou no app' : 'Sem acesso';
      return { dayNumber: i + 1, loggedIn: d.loggedIn, activities: d.activities, today: d.date === todayIso, future, tip };
    });
  });

  readonly activeDays = computed(() => this.days().filter(d => d.loggedIn).length);
  readonly totalActivities = computed(() => this.days().reduce((sum, d) => sum + d.activities, 0));

  ngOnInit(): void {
    this.load();
  }

  shiftMonth(delta: number): void {
    if (delta > 0 && this.isCurrentMonth()) return;
    let m = this.month() + delta;
    let y = this.year();
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    this.month.set(m);
    this.year.set(y);
    this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.days.set(await firstValueFrom(this.api.activityCalendar(this.year(), this.month())));
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar o calendário.');
      this.days.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}

function localIso(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
