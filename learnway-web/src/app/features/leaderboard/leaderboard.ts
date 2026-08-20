import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { LeaderboardEntry } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Avatar, Empty } from '../../shared/widgets';

@Component({
  selector: 'lw-leaderboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Avatar, Empty],
  template: `
    <div class="page page--board">
      <header class="page-head">
        <span class="lw-label">Placar</span>
        <h1 class="page-title">Ranking semanal</h1>
        <p class="page-subtitle">Top 10 por XP conquistado na semana. Zera toda segunda-feira à meia-noite — corre pro pódio.</p>
      </header>

      @if (loading()) {
        <div class="skeleton" style="height: 200px; margin-bottom: 16px"></div>
        <div class="skeleton" style="height: 300px"></div>
      } @else if (entries().length === 0) {
        <div class="card">
          <lw-empty icon="trophy" title="Semana ainda sem pontuação"
                    message="Complete lições e revisões para abrir o placar — o primeiro lugar está vago." />
        </div>
      } @else {
        <!-- pódio -->
        <div class="podium anim-fade-up">
          @for (slot of podium(); track slot.pos) {
            <div class="podium__slot" [class]="'podium__slot podium__slot--' + slot.pos">
              @if (slot.entry; as e) {
                <div class="podium__crown">
                  @if (slot.pos === 1) { <lw-icon name="crown" [size]="24" /> }
                </div>
                <lw-avatar [name]="e.username" [url]="e.avatarUrl" [size]="slot.pos === 1 ? 66 : 52" />
                <strong class="podium__name">{{ e.username }}</strong>
                <span class="chip mono">{{ e.xpThisWeek }} XP</span>
                <div class="podium__base mono">{{ slot.pos }}º</div>
              } @else {
                <div class="podium__crown"></div>
                <div class="podium__vacant">?</div>
                <strong class="podium__name muted">vago</strong>
                <div class="podium__base mono">{{ slot.pos }}º</div>
              }
            </div>
          }
        </div>

        <!-- lista completa -->
        <div class="list anim-fade-up">
          @for (e of entries(); track e.userId) {
            <div class="row" [class.row--me]="e.currentUser">
              <span class="row__rank numeral" [class.row__rank--top]="e.rank <= 3">{{ e.rank }}</span>
              <lw-avatar [name]="e.username" [url]="e.avatarUrl" [size]="34" />
              <div class="row__who">
                <strong>{{ e.username }} @if (e.currentUser) { <span class="chip">você</span> }</strong>
                <span class="muted">Nível {{ e.level }}</span>
              </div>
              @if (e.topOfWeek) { <span class="chip"><lw-icon name="trophy" [size]="12" /> Top da Semana</span> }
              <span class="row__xp mono">{{ e.xpThisWeek }} XP</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page--board { max-width: 720px; }

    .podium {
      display: flex; align-items: flex-end; justify-content: center; gap: var(--lw-space-md);
      margin-bottom: var(--lw-space-2xl);
      padding-top: var(--lw-space-sm);
    }
    .podium__slot {
      display: flex; flex-direction: column; align-items: center; gap: var(--lw-space-sm);
      flex: 1; max-width: 170px;
    }
    .podium__crown { height: 26px; color: var(--lw-ink-faint); }
    .podium__slot--1 .podium__crown { color: var(--lw-accent); }
    .podium__name {
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-size: var(--lw-text-h3); font-weight: 600;
      max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .podium__vacant {
      width: 52px; height: 52px; border-radius: var(--lw-radius-sm);
      display: flex; align-items: center; justify-content: center;
      border: 1px dashed var(--lw-rule-strong);
      color: var(--lw-ink-faint);
      font-family: var(--lw-font-display); font-size: var(--lw-text-h2);
    }
    /* O degrau é papel empilhado: fio no topo, tinta cada vez mais funda. */
    .podium__base {
      width: 100%;
      text-align: center;
      border-radius: var(--lw-radius) var(--lw-radius) 0 0;
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-variant-numeric: tabular-nums;
      font-weight: 500; font-size: var(--lw-text-h2);
      padding-top: var(--lw-space-sm);
      border: 1px solid var(--lw-rule);
      border-bottom: none;
      background: var(--lw-paper-sunken);
      color: var(--lw-ink-faint);
    }
    .podium__slot--1 .podium__base {
      height: 86px;
      border-color: var(--lw-accent-edge);
      background: var(--lw-accent-wash);
      color: var(--lw-accent-deep);
    }
    .podium__slot--2 .podium__base { height: 60px; }
    .podium__slot--3 .podium__base { height: 44px; }
    .podium__slot--1 lw-avatar {
      outline: 2px solid var(--lw-accent);
      outline-offset: 3px;
      border-radius: var(--lw-radius-sm);
    }

    /* A lista é uma classificação impressa: linhas separadas por fio. */
    .list { display: flex; flex-direction: column; border-top: 1px solid var(--lw-rule); }
    .row {
      display: flex; align-items: center; gap: var(--lw-space-md);
      padding: 11px var(--lw-space-sm);
      border-bottom: 1px solid var(--lw-rule-hair);
      transition: background var(--lw-dur-fast) var(--lw-ease);
      &:hover { background: var(--lw-paper-sunken); }
    }
    .row--me {
      background: var(--lw-accent-wash);
      border-left: 2px solid var(--lw-accent);
      padding-left: calc(var(--lw-space-sm) - 2px);
    }
    .row__rank {
      width: 32px; text-align: right;
      font-size: var(--lw-text-h3); font-weight: 500;
      color: var(--lw-ink-faint);
    }
    .row__rank--top { color: var(--lw-ink); }
    .row__who {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: 1px;
      strong { font-size: var(--lw-text-sm); font-weight: 500; display: flex; align-items: center; gap: var(--lw-space-sm); }
      .muted { font-family: var(--lw-font-mono); font-size: 10.5px; }
    }
    .row__xp { font-size: 12.5px; color: var(--lw-ink-muted); }
    .row--me .row__xp { color: var(--lw-accent-deep); font-weight: 500; }

    @media (max-width: 560px) {
      .podium { gap: var(--lw-space-sm); }
      .row .chip { display: none; }
    }
  `],
})
export class Leaderboard implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly loading = signal(true);
  readonly entries = signal<LeaderboardEntry[]>([]);

  /** Pódio na ordem visual 2º · 1º · 3º. */
  readonly podium = computed(() => {
    const list = this.entries();
    return [2, 1, 3].map(pos => ({ pos, entry: list.find(e => e.rank === pos) ?? null }));
  });

  async ngOnInit(): Promise<void> {
    try {
      this.entries.set(await firstValueFrom(this.api.weeklyLeaderboard()));
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar o ranking.');
    } finally {
      this.loading.set(false);
    }
  }
}
