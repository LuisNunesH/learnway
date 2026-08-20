import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { StudySessionService } from '../../core/study-session.service';
import { Icon } from '../../shared/icon';
import { Avatar, ProgressBar } from '../../shared/widgets';

@Component({
  selector: 'lw-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Avatar, ProgressBar],
  template: `
    <header class="masthead">
      <div class="masthead__inner">
        <a class="brand" routerLink="/">
          <lw-icon name="gem" [size]="18" />
          <span class="brand__name">LearnWay</span>
        </a>

        <nav class="nav">
          <a routerLink="/" routerLinkActive="nav__link--active" [routerLinkActiveOptions]="{ exact: true }" class="nav__link">
            <lw-icon name="home" [size]="18" class="nav__icon" /><span>Início</span>
          </a>
          <a routerLink="/trilha" routerLinkActive="nav__link--active" class="nav__link">
            <lw-icon name="map" [size]="18" class="nav__icon" /><span>Trilha</span>
          </a>
          <a routerLink="/teoria" routerLinkActive="nav__link--active" class="nav__link">
            <lw-icon name="book-open" [size]="18" class="nav__icon" /><span>Teoria</span>
          </a>
          <a routerLink="/revisoes" routerLinkActive="nav__link--active" class="nav__link">
            <lw-icon name="gem" [size]="18" class="nav__icon" /><span>Revisões</span>
          </a>
          <a routerLink="/flashcards" routerLinkActive="nav__link--active" class="nav__link">
            <lw-icon name="cards" [size]="18" class="nav__icon" /><span>Cartas</span>
          </a>
          <a routerLink="/ranking" routerLinkActive="nav__link--active" class="nav__link">
            <lw-icon name="trophy" [size]="18" class="nav__icon" /><span>Ranking</span>
          </a>
          <a routerLink="/calendario" routerLinkActive="nav__link--active" class="nav__link">
            <lw-icon name="calendar" [size]="18" class="nav__icon" /><span>Calendário</span>
          </a>
        </nav>

        <div class="status">
          @if (session.active()) {
            <span class="stat stat--timer" title="Tempo de estudo desta sessão">
              <lw-icon name="timer" [size]="13" /> {{ session.display() }}
            </span>
          }
          <span class="stat stat--streak" title="Dias consecutivos de estudo">
            <lw-icon name="flame" [size]="13" /> {{ user()?.streakDays ?? 0 }}
          </span>
          <span class="stat stat--level" title="Nível {{ user()?.level }} — {{ user()?.xpIntoLevel }}/{{ user()?.xpForNextLevel }} XP">
            <span class="stat__nv">NV</span> {{ user()?.level ?? 1 }}
            <span class="stat__bar"><lw-progress [value]="xpPercent()" [height]="3" /></span>
          </span>

          <div class="menu">
            <button class="menu__trigger" (click)="menuOpen.set(!menuOpen())" aria-label="Menu do usuário">
              <lw-avatar [name]="user()?.username ?? '?'" [url]="user()?.avatarUrl" [size]="34" />
            </button>
            @if (menuOpen()) {
              <div class="menu__backdrop" (click)="menuOpen.set(false)"></div>
              <div class="menu__panel anim-pop">
                <div class="menu__id">
                  <strong>{{ user()?.username }}</strong>
                  <span class="muted">{{ user()?.email }}</span>
                </div>
                <a routerLink="/perfil" class="menu__item" (click)="menuOpen.set(false)">
                  <lw-icon name="user" [size]="16" /> Meu perfil
                </a>
                <button class="menu__item menu__item--danger" (click)="logout()">
                  <lw-icon name="log-out" [size]="16" /> Sair
                </button>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Progresso de leitura: o fio do cabeçalho se preenche com a rolagem. -->
      <div class="masthead__progress" [style.transform]="'scaleX(' + readProgress() / 100 + ')'" aria-hidden="true"></div>
    </header>

    <router-outlet />
  `,
  styles: [`
    /* O host precisa ser bloco: hosts Angular nascem inline, e elemento
       inline não serve de bloco de contenção para o masthead sticky. */
    :host { display: block; }

    /* Cabeçalho de jornal: fio embaixo, papel translúcido, nada de caixa. */
    .masthead {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--color-bg-topbar);
      backdrop-filter: blur(var(--lw-blur-nav)) saturate(140%);
      -webkit-backdrop-filter: blur(var(--lw-blur-nav)) saturate(140%);
      border-bottom: 1px solid var(--lw-rule);
    }
    .masthead__progress {
      position: absolute;
      left: 0; right: 0; bottom: -1px;
      height: 2px;
      background: var(--lw-accent);
      transform: scaleX(0);
      transform-origin: left center;
      pointer-events: none;
    }
    .masthead__inner {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: var(--lw-space-xl);
      padding: var(--lw-space-md) var(--lw-space-xl);
    }

    .brand {
      display: flex; align-items: center; gap: 9px;
      color: var(--lw-ink);
      lw-icon { color: var(--lw-accent); }
    }
    .brand__name {
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-size: 22px;
      font-weight: 600;
      letter-spacing: var(--lw-tracking-display);
    }

    /* Nav editorial: texto puro; o ativo ganha um fio terracota embaixo. */
    .nav { display: flex; gap: var(--lw-space-lg); flex: 1; }
    .nav__link {
      position: relative;
      display: flex; align-items: center; gap: 7px;
      padding: 6px 0;
      font-size: var(--lw-text-sm);
      font-weight: 450;
      color: var(--lw-ink-muted);
      transition: color var(--lw-dur-fast) var(--lw-ease);
      &:hover { color: var(--lw-ink); }
    }
    .nav__icon { display: none; }

    /* O fio cresce do centro quando a rota fica ativa. */
    .nav__link::after {
      content: '';
      position: absolute;
      left: 0; right: 0; bottom: 0;
      height: 2px;
      background: var(--lw-accent);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform var(--lw-dur) var(--lw-ease-out);
    }
    .nav__link--active {
      color: var(--lw-ink);
      font-weight: 550;
    }
    .nav__link--active::after { transform: scaleX(1); }

    /* Leituras de estado: mono minúsculo, separadas por fio vertical. */
    .status { display: flex; align-items: center; gap: var(--lw-space-md); }
    .stat {
      display: inline-flex; align-items: center; gap: 5px;
      padding-left: var(--lw-space-md);
      border-left: 1px solid var(--lw-rule);
      font-family: var(--lw-font-mono);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
      color: var(--lw-ink-muted);
    }
    .stat--timer  { color: var(--lw-eval-correct); border-left: none; padding-left: 0; }
    .stat--streak { color: var(--lw-streak); }
    .stat--level  { gap: 7px; color: var(--lw-level); }
    .stat__nv { color: var(--lw-ink-faint); }
    .stat__bar { width: 44px; display: inline-flex; }

    .menu { position: relative; padding-left: var(--lw-space-sm); }
    .menu__trigger {
      background: none; border: none; padding: 0; cursor: pointer;
      border-radius: var(--lw-radius-sm); line-height: 0;
      transition: opacity var(--lw-dur-fast) var(--lw-ease);
      &:hover { opacity: 0.8; }
    }
    .menu__backdrop { position: fixed; inset: 0; z-index: 60; }

    /* O menu FLUTUA — é a única coisa aqui que ganha sombra. */
    .menu__panel {
      position: absolute;
      right: 0; top: calc(100% + 12px);
      z-index: 61;
      width: 244px;
      padding: var(--lw-space-sm);
      display: flex; flex-direction: column; gap: 1px;
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-radius: var(--lw-radius);
      box-shadow: var(--lw-lift);
    }
    .menu__id {
      display: flex; flex-direction: column; gap: 1px;
      padding: 8px 10px 12px;
      border-bottom: 1px solid var(--lw-rule-hair);
      margin-bottom: 5px;
      strong {
        font-family: var(--lw-font-display);
        font-variation-settings: var(--lw-display-variation);
        font-size: var(--lw-text-h3);
        font-weight: 600;
      }
      span { font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
    }
    .menu__item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px;
      border-radius: var(--lw-radius-sm);
      border: none;
      background: none;
      color: var(--lw-ink);
      font-family: var(--lw-font-ui);
      font-size: var(--lw-text-sm);
      font-weight: 450;
      cursor: pointer;
      text-align: left;
      transition: background var(--lw-dur-fast) var(--lw-ease);
      &:hover { background: var(--lw-paper-sunken); }
      lw-icon { color: var(--lw-ink-faint); }
    }
    .menu__item--danger {
      color: var(--lw-eval-wrong);
      lw-icon { color: currentColor; }
      &:hover { background: var(--lw-eval-wrong-bg); }
    }

    /* No mobile a nav desce para a base e volta a ser ícone + rótulo. */
    @media (max-width: 900px) {
      .masthead__inner { padding: var(--lw-space-md) var(--lw-space-lg); gap: var(--lw-space-md); }
      .nav {
        position: fixed;
        left: 0; right: 0; bottom: 0;
        z-index: 50;
        gap: 0;
        background: var(--lw-paper-veil-strong);
        backdrop-filter: blur(var(--lw-blur-nav));
        -webkit-backdrop-filter: blur(var(--lw-blur-nav));
        border-top: 1px solid var(--lw-rule);
        justify-content: space-around;
        padding: 7px 4px calc(7px + env(safe-area-inset-bottom));
      }
      .nav__icon { display: block; }
      .nav__link {
        flex-direction: column; gap: 3px; padding: 5px 6px;
        font-family: var(--lw-font-mono);
        font-size: 9.5px;
        letter-spacing: var(--lw-tracking-micro);
        text-transform: uppercase;
      }
      .nav__link::after { display: none; }
      .nav__link--active { color: var(--lw-accent); }
      .stat__bar { display: none; }
    }
    @media (max-width: 560px) {
      .stat--timer { display: none; }
      .brand__name { font-size: 19px; }
    }
  `],
})
export class Shell implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  readonly session = inject(StudySessionService);

  readonly user = this.auth.user;
  readonly menuOpen = signal(false);
  readonly readProgress = signal(0);
  readonly xpPercent = computed(() => {
    const u = this.user();
    if (!u || u.xpForNextLevel <= 0) return 0;
    return (u.xpIntoLevel / u.xpForNextLevel) * 100;
  });

  private scrollQueued = false;

  /** Progresso de leitura da página, amortecido em um rAF por quadro. */
  @HostListener('window:scroll')
  onScroll(): void {
    if (this.scrollQueued) return;
    this.scrollQueued = true;
    requestAnimationFrame(() => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      this.readProgress.set(max > 8 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
      this.scrollQueued = false;
    });
  }

  ngOnInit(): void {
    this.registerVisit();
    this.refreshUser();
  }

  /** Marca presença do dia no calendário (idempotente no backend). */
  private async registerVisit(): Promise<void> {
    try {
      await firstValueFrom(this.api.activityVisit());
    } catch {
      /* melhor esforço */
    }
  }

  private async refreshUser(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.api.profile());
      this.auth.setUser(profile.user);
    } catch {
      /* mantém o usuário do cache local */
    }
  }

  async logout(): Promise<void> {
    this.menuOpen.set(false);
    await this.session.end();
    this.auth.logout();
    this.router.navigateByUrl('/entrar');
  }
}
