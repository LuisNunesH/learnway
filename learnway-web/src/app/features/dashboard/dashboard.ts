import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, NgZone, OnDestroy, OnInit,
  afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { ToastService } from '../../core/toast.service';
import { LeaderboardEntry, LessonNode, ReviewStats, SessionStats, Trail } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Odometer } from '../../shared/odometer';
import { Avatar, Crystal, ProgressBar } from '../../shared/widgets';

interface NextLesson { lesson: LessonNode; topicTitle: string; subtopicTitle: string; }
interface Headline { lead: string; em: string; tail: string; }
interface Cta { label: string; link: unknown[]; }

/**
 * Filmagem de atmosfera da placa do hero (a mesma nos dois temas; muda o
 * tratamento). Fica em learnway-web/public, e não num CDN de terceiro: a
 * origem externa some sem aviso e o hero quebraria em produção sem ninguém
 * perceber. Servida junto com o site, é o mesmo CDN do resto.
 */
const PLATE_SRC = 'media/hero-plate.mp4';

/**
 * Acima desta largura a placa vale os 8 MB do vídeo; abaixo, não.
 *
 * No celular a placa já é só um fundo esmaecido atrás do texto (ver o bloco
 * de 599px lá embaixo), então o vídeo custa dado móvel para quase nada. O
 * corte é por largura E por `Save-Data`: quem pediu economia recebe economia.
 */
const PLATE_MIN_WIDTH = 600;

/** Classes no <html> que "armam" a coreografia antes da primeira pintura. */
const INTRO_HERO = 'lw-intro';
const INTRO_MASTHEAD = 'lw-intro-masthead';

/** A frase que se preenche com a rolagem, logo abaixo do hero. */
const MANIFESTO =
  'Cada lição concluída vira um cristal de conhecimento. Cada cristal revisado na hora certa vira ' +
  'memória de longo prazo. Um dia por vez, sem pular etapas — é assim que se aprende Java de verdade.';

/** Atraso (ms) do giro do odômetro, encaixado após a subida dos números (t = 1,04 s). */
const ODOMETER_DELAY = 1150;

/** Cabeçalhos que já tiveram a entrada: a coreografia do masthead é uma por Shell. */
const mastheadsPlayed = new WeakSet<Element>();

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const q = (root: Element, selector: string): Element[] => Array.from(root.querySelectorAll(selector));

/** Curva de animação lida dos tokens, para a WAAPI usar a mesma do CSS. */
function easeToken(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** 95 → "1h 35min"; 45 → "45min". */
function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

/**
 * Home — a capa da edição do dia.
 *
 * Um hero de tela cheia com a tipografia travada à esquerda e uma placa de
 * vídeo à direita, entrando com uma coreografia de tempo absoluto (WAAPI);
 * daí para baixo a página é uma rolagem contínua com inércia, em que cada
 * bloco reage à passagem: a frase que se preenche, a linha do tempo das
 * trilhas que se desenha, as barras da semana que crescem.
 *
 * Tudo aqui respeita `prefers-reduced-motion`: sem coreografia, sem inércia,
 * vídeo parado, blocos já no lugar.
 */
@Component({
  selector: 'lw-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Avatar, Crystal, ProgressBar, Odometer],
  template: `
    <!-- LUTs da placa de vídeo. Os dois primeiros são os da referência (cinema
         escuro, para o nanquim); o terceiro inverte a luz para o papel. -->
    <svg class="lw-svgdefs" aria-hidden="true" focusable="false">
      <filter id="lw-grade-ink" color-interpolation-filters="sRGB">
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.0018 0.0105 0.0154 0.0228 0.0307 0.0404 0.0485 0.0585 0.0719 0.0923 0.1205 0.1466 0.1657 0.1866 0.2197 0.2405 0.2485 0.2921 0.3362 0.3465 0.3472 0.3781 0.3781 0.4078 0.4199 0.4391 0.4604 0.4763 0.4798 0.5197 0.5473 0.5720 0.5995 0.6048 0.6232 0.6322 0.6483 0.6734 0.7201 0.7201 0.7410 0.7707 0.7707 0.7790 0.8084 0.8084 0.8390 0.8595 0.8707 0.8870 0.8993 0.9085 0.9132 0.9132 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9162 0.9238 0.9300"/>
          <feFuncG type="table" tableValues="0.0023 0.0106 0.0159 0.0250 0.0333 0.0445 0.0535 0.0620 0.0707 0.0827 0.0936 0.1063 0.1214 0.1402 0.1678 0.1727 0.2029 0.2176 0.2461 0.2757 0.2814 0.3050 0.3415 0.3692 0.3826 0.3884 0.4617 0.4617 0.4617 0.4643 0.4643 0.4808 0.5706 0.6005 0.6005 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6390 0.6524 0.6664 0.6805 0.6945 0.7086 0.7227 0.7367 0.7508 0.7648 0.7789 0.7929 0.8070 0.8211 0.8351 0.8492 0.8632 0.8773 0.8913 0.9054 0.9195 0.9300"/>
          <feFuncB type="table" tableValues="0.0021 0.0110 0.0187 0.0311 0.0377 0.0466 0.0584 0.0706 0.0791 0.0924 0.1039 0.1145 0.1316 0.1464 0.1614 0.1719 0.1887 0.2014 0.2247 0.2458 0.2954 0.2954 0.3089 0.3938 0.3938 0.3988 0.3988 0.4581 0.4581 0.4762 0.4762 0.4763 0.5374 0.5560 0.5813 0.5813 0.5813 0.5813 0.5835 0.5969 0.6104 0.6238 0.6373 0.6507 0.6642 0.6777 0.6911 0.7046 0.7181 0.7315 0.7449 0.7584 0.7719 0.7853 0.7988 0.8123 0.8257 0.8391 0.8526 0.8661 0.8795 0.8930 0.9065 0.9199 0.9300"/>
        </feComponentTransfer>
      </filter>
      <filter id="lw-grade-ink-lift" color-interpolation-filters="sRGB">
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.0016 0.0092 0.0136 0.0201 0.0270 0.0356 0.0427 0.0515 0.0633 0.0812 0.1060 0.1290 0.1458 0.1642 0.1933 0.2116 0.2187 0.2570 0.2959 0.3049 0.3055 0.3327 0.3327 0.3589 0.3695 0.3864 0.4052 0.4191 0.4222 0.4573 0.4816 0.5034 0.5276 0.5322 0.5484 0.5563 0.5705 0.5926 0.6337 0.6337 0.6521 0.6782 0.6782 0.6855 0.7114 0.7114 0.7383 0.7564 0.7662 0.7806 0.7914 0.7995 0.8036 0.8036 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8063 0.8129 0.8184"/>
          <feFuncG type="table" tableValues="0.0015 0.0069 0.0103 0.0163 0.0216 0.0289 0.0348 0.0403 0.0460 0.0538 0.0608 0.0691 0.0789 0.0911 0.1091 0.1123 0.1319 0.1414 0.1600 0.1792 0.1829 0.1983 0.2220 0.2400 0.2487 0.2525 0.3001 0.3001 0.3001 0.3018 0.3018 0.3125 0.3709 0.3903 0.3903 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4153 0.4241 0.4332 0.4423 0.4514 0.4606 0.4698 0.4789 0.4880 0.4971 0.5063 0.5154 0.5246 0.5337 0.5428 0.5520 0.5611 0.5702 0.5793 0.5885 0.5977 0.6045"/>
          <feFuncB type="table" tableValues="0.0013 0.0066 0.0112 0.0187 0.0226 0.0280 0.0350 0.0424 0.0475 0.0554 0.0623 0.0687 0.0790 0.0878 0.0968 0.1031 0.1132 0.1208 0.1348 0.1475 0.1772 0.1772 0.1853 0.2363 0.2363 0.2393 0.2393 0.2749 0.2749 0.2857 0.2857 0.2858 0.3224 0.3336 0.3488 0.3488 0.3488 0.3488 0.3501 0.3581 0.3662 0.3743 0.3824 0.3904 0.3985 0.4066 0.4147 0.4228 0.4309 0.4389 0.4469 0.4550 0.4631 0.4712 0.4793 0.4874 0.4954 0.5035 0.5116 0.5197 0.5277 0.5358 0.5439 0.5519 0.5580"/>
        </feComponentTransfer>
      </filter>
      <!-- Papel: dessatura, inverte e comprime a luz para [0.3, 1]. Com
           mix-blend-mode: multiply, o preto da filmagem vira papel intocado e
           o que era luz vira tinta — a imagem fica IMPRESSA, não colada. A
           curva em três pontos dá corpo aos meios-tons (senão só o brilho
           mais forte da filmagem chega ao papel). -->
      <filter id="lw-grade-paper" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncR type="table" tableValues="1 0.62 0.34"/>
          <feFuncG type="table" tableValues="1 0.58 0.30"/>
          <feFuncB type="table" tableValues="1 0.55 0.28"/>
        </feComponentTransfer>
        <!-- Tinta quente: um resto de vermelho e menos azul, como sépia. -->
        <feColorMatrix type="matrix" values="1 0 0 0 0   0 0.92 0 0 0   0 0 0.84 0 0   0 0 0 1 0"/>
      </filter>
    </svg>

    <!-- ============ HERO ============ -->
    <section class="hero" #hero>
      <div class="hero__plate" #plate aria-hidden="true">
        @if (plateVideo()) {
          <div class="plate plate--base">
            <video autoplay muted loop playsinline preload="auto" [src]="plateSrc"></video>
          </div>
          <div class="plate plate--lift">
            <video autoplay muted loop playsinline preload="auto" [src]="plateSrc"></video>
          </div>
        }
        <div class="hero__scrim"></div>
        <div class="hero__lamp"></div>
      </div>

      <div class="hero__inner">
        <span class="lw-label hero__eyebrow" data-fx="eyebrow">Painel · {{ todayLabel() }}</span>

        <div class="sp sp-a"></div>

        <h1 class="hero__title">
          <span class="ln"><span data-fx="line">{{ greeting() }}, {{ user()?.username }}.</span></span>
          <span class="ln"><span data-fx="line">{{ headline().lead }} <em>{{ headline().em }}</em>{{ headline().tail }}</span></span>
        </h1>

        <p class="hero__sub mono" data-fx="sub">{{ subLines()[0] }}<br>{{ subLines()[1] }}</p>

        <a class="btn btn--primary btn--lg hero__cta" [routerLink]="cta().link" data-fx="cta">
          {{ cta().label }} <lw-icon name="arrow-right" [size]="17" />
        </a>

        <div class="sp sp-b"></div>

        <div class="hero__stats">
          <div class="hstat">
            <span class="hstat__num numeral" data-fx="num">
              <lw-odometer [value]="user()?.streakDays ?? 0" [delay]="odometerDelay" /><small>dias</small>
            </span>
            <span class="hstat__lab" data-fx="lab"><lw-icon name="flame" [size]="12" /> seguidos de estudo</span>
          </div>
          <i class="hstat__rule" data-fx="rule" aria-hidden="true"></i>

          <div class="hstat">
            <span class="hstat__num numeral" data-fx="num">
              <lw-odometer [value]="user()?.xpTotal ?? 0" [delay]="odometerDelay" /><small>XP</small>
            </span>
            <span class="hstat__lab" data-fx="lab"><lw-icon name="zap" [size]="12" /> nível {{ user()?.level ?? 1 }} · faltam {{ xpMissing() }} XP</span>
          </div>
          <i class="hstat__rule" data-fx="rule" aria-hidden="true"></i>

          <a class="hstat hstat--link" routerLink="/revisoes" [class.hstat--alert]="(reviewStats()?.overdue ?? 0) > 0">
            <span class="hstat__num numeral" data-fx="num">
              <lw-odometer [value]="reviewStats()?.crystalsToReview ?? 0" [delay]="odometerDelay" />
            </span>
            <span class="hstat__lab" data-fx="lab">
              <lw-crystal [urgency]="crystalUrgency()" [size]="13" />
              {{ (reviewStats()?.crystalsToReview ?? 0) === 1 ? 'cristal pede revisão' : 'cristais pedem revisão' }}
              <lw-icon name="arrow-right" [size]="13" class="hstat__chev" />
            </span>
          </a>
          <i class="hstat__rule" data-fx="rule" aria-hidden="true"></i>

          <div class="hstat">
            <span class="hstat__num numeral" data-fx="num">
              <lw-odometer [value]="sessionStats()?.todayMinutes ?? 0" [delay]="odometerDelay" />
              <small>/{{ sessionStats()?.dailyGoalMinutes ?? 20 }} min</small>
            </span>
            <span class="hstat__lab" data-fx="lab"><lw-icon name="target" [size]="12" /> da meta de hoje</span>
            <lw-progress [value]="goalPercent()" [height]="3" color="success" data-fx="lab" />
          </div>
        </div>
      </div>
    </section>

    <!-- ============ A PÁGINA CONTINUA ============ -->
    <div class="page page--home">
      <p class="manifesto" #manifesto [attr.aria-label]="manifesto">
        @for (w of manifestoWords; track $index) {
          <span class="w" aria-hidden="true">{{ w }}</span>{{ ' ' }}
        }
      </p>

      @if (loading()) {
        <div class="columns">
          <div class="col-main"><div class="skeleton" style="height: 360px"></div></div>
          <div class="col-side">
            <div class="skeleton" style="height: 220px"></div>
            <div class="skeleton" style="height: 180px"></div>
          </div>
        </div>
      } @else {
        <div class="columns">
          <div class="col-main">
            <!-- trilhas: uma linha do tempo que se desenha com a rolagem -->
            <section class="trails lw-reveal">
              <div class="section-head">
                <h2>Suas trilhas</h2>
                <a routerLink="/trilha" class="see-all">Ver mapa completo <lw-icon name="arrow-right" [size]="13" /></a>
              </div>
              <div class="index" #index>
                <i class="rail" #rail aria-hidden="true"><i class="rail__fill" #railFill></i></i>
                @for (topic of trail()?.topics ?? []; track topic.id) {
                  <a class="entry" routerLink="/trilha" [fragment]="topic.slug">
                    <i class="entry__dot" aria-hidden="true"></i>
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

          <aside class="col-side">
            <!-- minutos da semana: as barras crescem quando o painel entra na tela -->
            <section class="panel lw-reveal" #weekPanel>
              <h3 class="panel__title">Minutos de estudo</h3>
              <span class="lw-label">últimos 7 dias</span>
              <div class="week-chart" [class.is-in]="chartIn()" role="img"
                   aria-label="Minutos de estudo por dia na última semana">
                @for (day of weekDays(); track day.date; let i = $index) {
                  <div class="week-chart__slot" [attr.data-tip]="day.tip">
                    <div class="week-chart__bar" [style.height.%]="day.pct"
                         [style.transition-delay]="(i * 90) + 'ms, 0ms'"
                         [class.week-chart__bar--today]="day.today"></div>
                    <span class="week-chart__label">{{ day.label }}</span>
                  </div>
                }
              </div>
              <p class="week-total">Total da semana <b class="numeral">{{ weekTotalLabel() }}</b></p>
            </section>

            <!-- mini ranking -->
            <section class="panel lw-reveal">
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
          </aside>
        </div>
      }

      <footer class="colophon lw-reveal">
        <span class="lw-label">LearnWay · edição de {{ todayLabel() }}</span>
        <span class="lw-label">Bons estudos</span>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ================= HERO ================= */
    .hero {
      position: relative;
      display: flex;
      min-height: calc(100svh - var(--lw-masthead-h));
      overflow: hidden;
      border-bottom: 1px solid var(--lw-rule);
    }
    .hero__inner {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: var(--lw-page-width);
      margin: 0 auto;
      padding: var(--lw-space-xl) var(--lw-space-xl) var(--lw-space-2xl);
      display: flex;
      flex-direction: column;
    }
    /* Espaçadores fluidos na proporção da referência (239 / 194): o hero
       respira com a altura da janela e as leituras assentam no pé. */
    .sp { flex: 1 0 var(--lw-space-lg); }
    .sp-a { flex-grow: 239; }
    .sp-b { flex-grow: 194; }

    .hero__eyebrow { display: inline-flex; align-items: center; gap: var(--lw-space-sm); }
    .hero__eyebrow::before {
      content: '';
      width: 22px; height: 1px;
      background: var(--lw-accent);
    }

    /* A manchete: serifa grande, tracking apertado, itálico terracota no
       destaque — a mesma voz da capa do login. Cada linha vive numa máscara
       (overflow hidden) e sobe de dentro dela na entrada; o respiro embaixo
       protege os descendentes da serifa. */
    .hero__title {
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-size: var(--lw-text-hero);
      font-weight: 500;
      line-height: 1.04;
      letter-spacing: var(--lw-tracking-hero);
      max-width: 62%;
      em { font-style: italic; font-weight: 400; color: var(--lw-accent); }
    }
    .ln { display: block; overflow: hidden; padding-bottom: 0.12em; margin-bottom: -0.12em; }
    .ln > span { display: inline-block; will-change: transform; }

    .hero__sub {
      margin-top: var(--lw-space-lg);
      font-size: 15px;
      line-height: 1.7;
      letter-spacing: var(--lw-tracking-tight);
      color: var(--lw-ink-muted);
      max-width: 48ch;
    }
    .hero__cta { margin-top: var(--lw-space-xl); align-self: flex-start; }

    /* Leituras: quatro colunas separadas por réguas verticais que se desenham. */
    .hero__stats {
      display: grid;
      grid-template-columns: auto 1px auto 1px auto 1px auto;
      column-gap: var(--lw-space-xl);
      align-items: stretch;
    }
    .hstat { display: flex; flex-direction: column; gap: 6px; min-width: 0; color: inherit; }
    .hstat__num {
      display: flex; align-items: baseline; gap: 6px;
      font-size: 40px;
      font-weight: 500;
      line-height: 1;
      color: var(--lw-ink);
    }
    .hstat__num small {
      font-family: var(--lw-font-ui);
      font-size: 12px;
      font-weight: 450;
      letter-spacing: 0;
      color: var(--lw-ink-muted);
    }
    .hstat__lab {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 13px;
      color: var(--lw-ink-muted);
      transition: color var(--lw-dur-fast) var(--lw-ease);
    }
    .hstat lw-progress { width: 132px; margin-top: 2px; }
    .hstat__rule {
      display: block;
      width: 1px;
      background: linear-gradient(180deg, transparent, var(--lw-rule-strong) 50%, transparent);
      transform-origin: center;
    }
    .hstat--link { cursor: pointer; }
    .hstat__chev {
      opacity: 0; transform: translateX(-4px);
      transition: opacity var(--lw-dur-fast) var(--lw-ease), transform var(--lw-dur-fast) var(--lw-ease);
    }
    .hstat--link:hover .hstat__lab { color: var(--lw-accent-deep); }
    .hstat--link:hover .hstat__chev { opacity: 1; transform: translateX(0); }
    .hstat--alert .hstat__num { color: var(--lw-eval-wrong); }

    /* ---- placa de vídeo ----
       Dois passes sincronizados. O tratamento por tema vem dos tokens
       (--lw-plate-*): impresso em multiply no papel, cinema no nanquim.
       As máscaras somem para a esquerda (onde mora o texto) e para o pé.
       "black" numa máscara é "opaco", não cor. */
    .hero__plate { position: absolute; inset: 0; pointer-events: none; }
    .hero__plate::before {
      content: '';
      position: absolute; inset: 0; left: 34%;
      background: radial-gradient(60% 70% at 78% 45%, var(--lw-accent-wash), transparent 70%);
    }
    .plate {
      position: absolute; inset: 0; left: 34%;
      overflow: hidden;
      opacity: 0;
      transition: opacity var(--lw-dur-roll) var(--lw-ease);
      -webkit-mask-image:
        linear-gradient(90deg, transparent 0%, black 42%),
        linear-gradient(180deg, black 52%, transparent 100%);
      mask-image:
        linear-gradient(90deg, transparent 0%, black 42%),
        linear-gradient(180deg, black 52%, transparent 100%);
      -webkit-mask-composite: source-in;
      mask-composite: intersect;
    }
    .plate video {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: right center;
      display: block;
    }
    .plate--base {
      filter: var(--lw-plate-filter);
      mix-blend-mode: var(--lw-plate-blend);
    }
    .plate--lift {
      display: var(--lw-plate-lift);
      filter: url(#lw-grade-ink-lift);
      mix-blend-mode: plus-lighter;
      -webkit-mask-image:
        linear-gradient(90deg, transparent 0%, black 42%),
        linear-gradient(180deg, transparent 21.5%, black 100%);
      mask-image:
        linear-gradient(90deg, transparent 0%, black 42%),
        linear-gradient(180deg, transparent 21.5%, black 100%);
    }
    /* A placa só aparece quando o vídeo pode tocar — e some se ele falhar. */
    .hero__plate.is-ready .plate--base { opacity: var(--lw-plate-opacity); }
    .hero__plate.is-ready .plate--lift { opacity: 0.35; }
    .hero__plate.is-broken .plate { display: none; }

    .hero__scrim {
      position: absolute; inset: 0;
      background: linear-gradient(100deg,
        var(--lw-paper) 26%,
        color-mix(in srgb, var(--lw-paper) 74%, transparent) 50%,
        color-mix(in srgb, var(--lw-paper) 18%, transparent) 76%,
        transparent 92%);
    }
    /* Luz que segue o cursor: o JS só escreve --mx/--my; o brilho é CSS. */
    .hero__lamp {
      position: absolute; inset: 0;
      opacity: 0;
      transition: opacity var(--lw-dur-slow) var(--lw-ease);
      background: radial-gradient(420px circle at var(--mx, 72%) var(--my, 42%), var(--lw-accent-wash), transparent 70%);
    }
    @media (hover: hover) {
      .hero:hover .hero__lamp { opacity: 1; }
    }

    /* Estado ARMADO (html.lw-intro): tudo escondido até a coreografia levar
       cada peça ao lugar. A classe entra antes da primeira pintura e sai no
       fim, então nunca há flash da página pronta. */
    :host-context(.lw-intro) {
      .hero__eyebrow, .hero__sub, .hstat__num, .hstat__lab, .hstat lw-progress { opacity: 0; }
      .ln > span { transform: translateY(120%); }
      .hstat__rule { transform: scaleY(0); }
      .hero__cta { clip-path: inset(0 100% 0 0); }
    }

    /* ================= A PÁGINA CONTINUA ================= */
    .page--home { padding-top: var(--lw-space-3xl); }

    /* A frase que se preenche: cada palavra ganha tinta conforme a rolagem
       passa por ela (o JS escreve --fill de 0 a 1, com três palavras de
       degradê). */
    .manifesto {
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-size: var(--lw-text-display);
      font-weight: 400;
      line-height: 1.22;
      letter-spacing: var(--lw-tracking-display);
      color: var(--lw-ink);
      max-width: 26ch;
      margin: 0 0 var(--lw-space-3xl);
      padding-bottom: var(--lw-space-2xl);
      border-bottom: 1px solid var(--lw-rule);
    }
    .manifesto .w {
      opacity: calc(0.16 + var(--fill, 0) * 0.84);
      transition: opacity var(--lw-dur) linear;
    }

    .columns { display: grid; grid-template-columns: 1fr 320px; gap: var(--lw-space-2xl); align-items: start; }
    .col-main, .col-side { display: flex; flex-direction: column; gap: var(--lw-space-2xl); min-width: 0; }
    .col-side > .skeleton { flex-shrink: 0; }

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
      position: relative;
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--lw-font-mono); font-size: 10.5px;
      letter-spacing: var(--lw-tracking-micro); text-transform: uppercase;
      color: var(--lw-ink-muted);
      white-space: nowrap;
      &:hover { color: var(--lw-accent-deep); }
    }
    /* Micro-label em mono tem 17px de altura — metade do que um dedo acerta.
       O alvo cresce por fora, sem mexer na linha de base do cabeçalho da
       seção (que alinha por baseline com o h2 ao lado). */
    @media (pointer: coarse) {
      .see-all::after {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% + 16px); height: 44px;
      }
    }

    /* ---- trilhas: linha do tempo que se desenha ----
       Um trilho à esquerda se preenche de tinta conforme a linha de leitura
       (55% da janela) desce; cada trilha acende quando a tinta chega nela. */
    .index { position: relative; display: flex; flex-direction: column; padding-left: 34px; }
    .rail {
      position: absolute; left: 14px; top: 12px; bottom: 12px;
      width: 2px;
      background: var(--lw-rule);
    }
    .rail__fill { position: absolute; left: 0; top: 0; width: 100%; height: 0; background: var(--lw-ink); }
    .entry {
      position: relative;
      display: flex; align-items: center; gap: var(--lw-space-md);
      padding: var(--lw-space-md) var(--lw-space-sm);
      border-bottom: 1px solid var(--lw-rule-hair);
      transition: background var(--lw-dur-fast) var(--lw-ease), padding-left var(--lw-dur-fast) var(--lw-ease);
      &:hover { background: var(--lw-paper-sunken); padding-left: var(--lw-space-md); }
      &:hover .entry__chev { opacity: 1; transform: translateX(0); }
    }
    .entry__dot {
      position: absolute; left: -25px; top: 50%;
      width: 11px; height: 11px; margin-top: -6px;
      border-radius: 999px;
      background: var(--lw-paper);
      border: 2px solid var(--lw-rule-strong);
      transition: background var(--lw-dur) var(--lw-ease), border-color var(--lw-dur) var(--lw-ease), transform var(--lw-dur) var(--lw-ease-out);
    }
    .entry.is-lit .entry__dot { background: var(--lw-ink); border-color: var(--lw-ink); transform: scale(1.25); }
    .entry__icon { color: var(--lw-ink-faint); flex-shrink: 0; }
    .entry__name {
      flex: 1; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: var(--lw-text-sm); font-weight: 450;
      color: var(--lw-ink-muted);
      transition: color var(--lw-dur) var(--lw-ease);
    }
    .entry.is-lit .entry__name { color: var(--lw-ink); }
    .entry__bar {
      width: 84px; flex-shrink: 0;
      transform: scaleX(0); transform-origin: left center;
      transition: transform var(--lw-dur-slow) var(--lw-ease-out);
    }
    .entry.is-lit .entry__bar { transform: scaleX(1); }
    .entry__count { font-size: 11.5px; color: var(--lw-ink-muted); width: 44px; text-align: right; flex-shrink: 0; }
    .entry__soon { flex-shrink: 0; }
    .entry__chev {
      color: var(--lw-ink-faint); flex-shrink: 0;
      opacity: 0; transform: translateX(-4px);
      transition: opacity var(--lw-dur-fast) var(--lw-ease), transform var(--lw-dur-fast) var(--lw-ease);
    }

    /* ---- painéis da coluna lateral (grudam e acompanham a leitura) ---- */
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
    /* As barras nascem deitadas e sobem em cascata quando o painel entra na
       tela (transition-delay por barra vem do template). */
    .week-chart__bar {
      width: 100%;
      max-width: 20px;
      min-height: 3px;
      background: var(--lw-paper-deep);
      border-radius: 2px 2px 0 0;
      transform: scaleY(0);
      transform-origin: bottom center;
      transition: transform var(--lw-dur-roll) var(--lw-ease-out), background var(--lw-dur-fast) var(--lw-ease);
    }
    .week-chart.is-in .week-chart__bar { transform: scaleY(1); }
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

    /* O fecho da edição. */
    .colophon {
      display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--lw-space-sm) var(--lw-space-md);
      margin-top: var(--lw-space-3xl);
      padding-top: var(--lw-space-lg);
      border-top: 1px solid var(--lw-rule);
    }

    /* ================= RESPONSIVO ================= */
    @media (min-width: 1041px) {
      .col-side { position: sticky; top: calc(var(--lw-masthead-h) + var(--lw-space-xl)); }
    }
    @media (max-width: 1040px) {
      .columns { grid-template-columns: 1fr; gap: var(--lw-space-xl); }
      .col-main, .col-side { gap: var(--lw-space-xl); }
      .plate { left: 22%; }
    }
    @media (max-width: 860px) {
      .hero__title { max-width: 80%; }
      .hero__stats {
        grid-template-columns: 1fr 1fr;
        gap: var(--lw-space-md) var(--lw-space-xl);
      }
      .hstat__rule { display: none; }
      .hstat { padding-top: var(--lw-space-md); border-top: 1px solid var(--lw-rule-hair); }
      .manifesto { font-size: var(--lw-text-h1); }
    }
    @media (max-width: 599px) {
      /* Celular: a placa vira fundo e o véu desce vertical, como na
         referência — o texto assenta sobre o papel na metade de baixo. */
      .hero { min-height: calc(100svh - var(--lw-masthead-h) - var(--lw-space-2xl)); }
      .hero__inner { padding: var(--lw-space-lg) var(--lw-space-lg) var(--lw-space-xl); }
      .hero__title { max-width: none; }
      .hero__plate::before,
      .plate { left: 0; }
      .plate {
        -webkit-mask-image: linear-gradient(180deg, black 30%, transparent 90%);
        mask-image: linear-gradient(180deg, black 30%, transparent 90%);
        -webkit-mask-composite: source-over;
        mask-composite: add;
      }
      .plate--lift {
        -webkit-mask-image: linear-gradient(180deg, transparent 10%, black 60%);
        mask-image: linear-gradient(180deg, transparent 10%, black 60%);
      }
      .plate video { object-position: 78% top; }
      .hero__scrim {
        background: linear-gradient(180deg,
          color-mix(in srgb, var(--lw-paper) 34%, transparent) 0%,
          color-mix(in srgb, var(--lw-paper) 56%, transparent) 24%,
          color-mix(in srgb, var(--lw-paper) 88%, transparent) 42%,
          var(--lw-paper) 66%);
      }
      .hstat__num { font-size: 32px; }
      .hstat lw-progress { width: 100%; }
      .manifesto { font-size: var(--lw-text-h2); }
      .entry__bar { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .manifesto .w { opacity: 1; }
      .week-chart__bar { transform: none; }
      .entry__bar { transform: none; }
      .plate { transition: none; }
    }
  `],
})
export class Dashboard implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);
  private injector = inject(Injector);
  private scroll = inject(SmoothScrollService);

  private heroRef = viewChild.required<ElementRef<HTMLElement>>('hero');
  private plateRef = viewChild.required<ElementRef<HTMLElement>>('plate');
  private manifestoRef = viewChild.required<ElementRef<HTMLElement>>('manifesto');
  private indexRef = viewChild<ElementRef<HTMLElement>>('index');
  private railRef = viewChild<ElementRef<HTMLElement>>('rail');
  private railFillRef = viewChild<ElementRef<HTMLElement>>('railFill');
  private weekPanelRef = viewChild<ElementRef<HTMLElement>>('weekPanel');

  readonly plateSrc = PLATE_SRC;

  /**
   * Se vale a pena baixar a placa em vídeo neste aparelho.
   *
   * Decidido uma vez, na construção, e nunca reavaliado: girar o celular não
   * pode disparar um download de 8 MB no meio da leitura. Como é signal, o
   * `@if` do template já nasce com a resposta certa — nenhum `<video>` chega
   * a existir no DOM do celular, então nem a requisição sai.
   */
  readonly plateVideo = signal(
    typeof matchMedia === 'function' &&
      matchMedia(`(min-width: ${PLATE_MIN_WIDTH}px)`).matches &&
      !(navigator as { connection?: { saveData?: boolean } }).connection?.saveData
  );

  readonly manifesto = MANIFESTO;
  readonly manifestoWords = MANIFESTO.split(/\s+/);
  readonly odometerDelay = ODOMETER_DELAY;

  readonly user = this.auth.user;
  readonly loading = signal(true);
  readonly chartIn = signal(false);
  readonly trail = signal<Trail | null>(null);
  readonly reviewStats = signal<ReviewStats | null>(null);
  readonly sessionStats = signal<SessionStats | null>(null);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);

  readonly top3 = computed(() => this.leaderboard().slice(0, 3));

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

  /** Segunda linha da manchete: contextual, com o destaque em itálico terracota. */
  readonly headline = computed<Headline>(() => {
    if ((this.reviewStats()?.overdue ?? 0) > 0) return { lead: 'Seus', em: 'cristais', tail: ' pedem revisão.' };
    if (this.nextLesson()) return { lead: 'Sua próxima', em: 'lição', tail: ' está pronta.' };
    return { lead: 'Pronto para mais', em: 'código', tail: '?' };
  });

  /** Subtexto em mono, duas linhas: de onde o usuário parou. */
  readonly subLines = computed<[string, string]>(() => {
    const next = this.nextLesson();
    if (next) {
      return [`${next.topicTitle} / ${next.subtopicTitle}`, `${next.lesson.title} · +${next.lesson.xpReward} XP`];
    }
    const due = this.reviewStats()?.crystalsToReview ?? 0;
    if (due > 0) {
      return [`${due} ${due === 1 ? 'cristal espera' : 'cristais esperam'} revisão`, 'Revisar hoje mantém o intervalo crescendo.'];
    }
    if (this.loading()) return ['Preparando a edição de hoje…', 'Sua trilha, seus cristais e sua meta.'];
    return ['Nenhuma lição pendente no momento.', 'Explore o mapa da trilha para o próximo passo.'];
  });

  readonly cta = computed<Cta>(() => {
    const next = this.nextLesson();
    if (next) return { label: 'Iniciar lição', link: ['/licao', next.lesson.id] };
    if ((this.reviewStats()?.crystalsToReview ?? 0) > 0) return { label: 'Revisar cristais', link: ['/revisoes'] };
    return { label: 'Ver mapa da trilha', link: ['/trilha'] };
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

  // ---- coreografia / efeitos de rolagem ----
  private armed = false;
  private mastheadArmed = false;
  private destroyed = false;
  private animations: Animation[] = [];
  private cleanups: Array<() => void> = [];
  private chartObserver?: IntersectionObserver;
  private fxQueued = false;
  private manifestoEls: HTMLElement[] = [];
  private resolveData!: () => void;
  private readonly dataReady = new Promise<void>(resolve => (this.resolveData = resolve));

  constructor() {
    // Arma ANTES da primeira pintura: a classe esconde as peças via CSS e a
    // coreografia as revela. Sem WAAPI ou com menos movimento, nada é armado
    // e a página nasce pronta.
    if ('animate' in Element.prototype && !reducedMotion()) {
      this.armed = true;
      document.documentElement.classList.add(INTRO_HERO);
      const masthead = document.querySelector('.masthead');
      if (masthead && !mastheadsPlayed.has(masthead)) {
        mastheadsPlayed.add(masthead);
        this.mastheadArmed = true;
        document.documentElement.classList.add(INTRO_MASTHEAD);
      }
    }

    afterNextRender(() => {
      this.setupPlate();
      this.bindLamp();
      this.bindScrollFx();
      void this.runIntro();
    });
  }

  async ngOnInit(): Promise<void> {
    this.scroll.start();
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
      this.resolveData();
      // Os blocos de baixo só existem depois de carregar: liga os efeitos neles.
      afterNextRender(() => {
        this.observeChart();
        this.updateFx();
      }, { injector: this.injector });
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.finishIntro();
    this.chartObserver?.disconnect();
    for (const off of this.cleanups) off();
    this.cleanups = [];
    this.scroll.stop();
  }

  // ------------------------------------------------------------------
  // Placa de vídeo: dois passes em sincronia (o mestre corrige o outro se
  // derivar mais de 0,12 s). Menos movimento = quadro parado.
  // ------------------------------------------------------------------
  private setupPlate(): void {
    const host = this.plateRef().nativeElement;
    const videos = Array.from(host.querySelectorAll('video'));
    if (videos.length === 0) return;
    const [master, ...rest] = videos;
    for (const v of videos) {
      v.muted = true;
      v.defaultMuted = true;
    }
    if (reducedMotion()) {
      for (const v of videos) {
        v.removeAttribute('autoplay');
        v.pause();
      }
    }

    this.zone.runOutsideAngular(() => {
      const onReady = () => host.classList.add('is-ready');
      const onError = () => host.classList.add('is-broken');
      const onTime = () => {
        for (const v of rest) {
          if (Math.abs(v.currentTime - master.currentTime) > 0.12) v.currentTime = master.currentTime;
          // O segundo passe carrega depois do mestre (mesma URL, cache em fila):
          // quando tiver dados, entra tocando em vez de esperar o próprio autoplay.
          if (v.paused && v.readyState >= 3 && !master.paused) void v.play().catch(() => undefined);
        }
      };
      master.addEventListener('canplay', onReady, { once: true });
      master.addEventListener('error', onError, { once: true });
      master.addEventListener('timeupdate', onTime);
      if (master.readyState >= 3) onReady();

      this.cleanups.push(() => {
        master.removeEventListener('canplay', onReady);
        master.removeEventListener('error', onError);
        master.removeEventListener('timeupdate', onTime);
        for (const v of videos) {
          v.pause();
          v.removeAttribute('src');
          v.load();
        }
      });
    });
  }

  /** Luz que segue o cursor: escreve --mx/--my no hero; o brilho é CSS. */
  private bindLamp(): void {
    const hero = this.heroRef().nativeElement;
    this.zone.runOutsideAngular(() => {
      const onMove = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
        hero.style.setProperty('--my', `${e.clientY - r.top}px`);
      };
      hero.addEventListener('pointermove', onMove, { passive: true });
      this.cleanups.push(() => hero.removeEventListener('pointermove', onMove));
    });
  }

  // ------------------------------------------------------------------
  // Efeitos dirigidos pela rolagem (um rAF por evento, fora da zone):
  // a frase que se preenche e a linha do tempo das trilhas.
  // ------------------------------------------------------------------
  private bindScrollFx(): void {
    this.zone.runOutsideAngular(() => {
      const schedule = () => {
        if (this.fxQueued) return;
        this.fxQueued = true;
        requestAnimationFrame(() => {
          this.fxQueued = false;
          this.updateFx();
        });
      };
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      this.cleanups.push(
        () => window.removeEventListener('scroll', schedule),
        () => window.removeEventListener('resize', schedule),
      );
      schedule();
    });
  }

  private updateFx(): void {
    if (this.destroyed) return;
    const vh = window.innerHeight || 800;

    // ---- texto que se preenche ----
    const manifesto = this.manifestoRef().nativeElement;
    if (this.manifestoEls.length === 0) {
      this.manifestoEls = Array.from(manifesto.querySelectorAll<HTMLElement>('.w'));
    }
    const r = manifesto.getBoundingClientRect();
    // 0 quando o topo da frase toca o pé da janela; 1 quando ela sai por cima.
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    // A pintura acontece entre 12% e 58% da travessia — enquanto se lê.
    const t = clamp((p - 0.12) / 0.46, 0, 1);
    const n = this.manifestoEls.length;
    const cursor = t * (n + 3) - 1.5;
    this.manifestoEls.forEach((w, i) => {
      w.style.setProperty('--fill', clamp((cursor - i) / 3, 0, 1).toFixed(3));
    });

    // ---- linha do tempo das trilhas ----
    const index = this.indexRef()?.nativeElement;
    const rail = this.railRef()?.nativeElement;
    const fill = this.railFillRef()?.nativeElement;
    if (index && rail && fill) {
      const line = vh * 0.55;
      const rr = rail.getBoundingClientRect();
      fill.style.height = `${clamp((line - rr.top) / Math.max(1, rr.height), 0, 1) * 100}%`;
      for (const entry of Array.from(index.querySelectorAll('.entry'))) {
        entry.classList.toggle('is-lit', entry.getBoundingClientRect().top + 10 < line);
      }
    }
  }

  /** As barras da semana crescem quando o painel entra na tela. */
  private observeChart(): void {
    const panel = this.weekPanelRef()?.nativeElement;
    if (!panel || this.chartObserver) return;
    if (!('IntersectionObserver' in window)) {
      this.chartIn.set(true);
      return;
    }
    this.chartObserver = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        this.chartIn.set(true);
        this.chartObserver?.disconnect();
      }
    }, { threshold: 0.35 });
    this.chartObserver.observe(panel);
  }

  // ------------------------------------------------------------------
  // Coreografia de entrada (WAAPI), tempos absolutos em segundos:
  //
  //   0.00 logo · 0.12 nav + eyebrow · 0.18 leituras do cabeçalho ·
  //   0.34 linhas da manchete · 0.74 subtexto · 0.90 CTA (wipe) ·
  //   0.98 réguas · 1.04 números · 1.10 rótulos · ~1.9 fim
  //
  // Espera as fontes (senão a serifa troca no meio da subida) e os dados
  // (senão a manchete muda de texto no ar), cada um com um teto. No fim
  // tira a classe armada e CANCELA tudo: nenhum estilo inline sobra.
  // ------------------------------------------------------------------
  private async runIntro(): Promise<void> {
    if (!this.armed) return;

    const fonts = document.fonts;
    const fontsReady = fonts
      ? Promise.all([fonts.load('500 40px Fraunces'), fonts.load('400 15px "JetBrains Mono"')]).then(() => fonts.ready)
      : Promise.resolve();
    await Promise.race([fontsReady.catch(() => undefined), wait(1000)]);
    await Promise.race([this.dataReady, wait(1200)]);
    await Promise.race([nextFrame(), wait(1200)]);
    if (this.destroyed) return;

    const k = matchMedia('(max-width: 599px)').matches ? 0.86 : 1;
    const ease = {
      expo: easeToken('--lw-ease-out', 'cubic-bezier(0.16, 1, 0.3, 1)'),
      quint: easeToken('--lw-ease-quint', 'cubic-bezier(0.22, 1, 0.36, 1)'),
      quart: easeToken('--lw-ease-quart', 'cubic-bezier(0.25, 1, 0.5, 1)'),
      type: easeToken('--lw-ease-type', 'cubic-bezier(0.22, 0.85, 0.24, 1)'),
    };
    const anims = this.animations;
    const play = (els: Element[], frames: Keyframe[], at: number, dur: number, easing: string, stagger = 0) => {
      els.forEach((el, i) => anims.push(el.animate(frames, {
        delay: (at + i * stagger) * 1000 * k,
        duration: dur * 1000 * k,
        easing,
        fill: 'both',
      })));
    };
    const rise = (px: number): Keyframe[] => [
      { opacity: 0, transform: `translateY(${px}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ];
    const fade: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

    const masthead = this.mastheadArmed ? document.querySelector('.masthead') : null;
    if (masthead) {
      play(q(masthead, '[data-intro="logo"]'), [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }], 0, 0.70, ease.expo);
      play(q(masthead, '[data-intro="nav"]'), rise(7), 0.12, 0.62, ease.quint, 0.055);
      play(q(masthead, '[data-intro="status"]'), fade, 0.18, 0.55, ease.quart, 0.04);
    }

    const hero = this.heroRef().nativeElement;
    play(q(hero, '[data-fx="eyebrow"]'), rise(7), 0.12, 0.62, ease.quint);
    play(q(hero, '[data-fx="line"]'), [{ transform: 'translateY(120%)' }, { transform: 'translateY(0)' }], 0.34, 0.98, ease.type, 0.09);
    play(q(hero, '[data-fx="sub"]'), rise(14), 0.74, 0.72, ease.quint);
    play(q(hero, '[data-fx="cta"]'), [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], 0.90, 0.70, ease.expo);
    play(q(hero, '[data-fx="rule"]'), [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], 0.98, 0.60, ease.quart, 0.07);
    play(q(hero, '[data-fx="num"]'), rise(12), 1.04, 0.66, ease.quint, 0.085);
    play(q(hero, '[data-fx="lab"]'), rise(10), 1.10, 0.62, ease.quint, 0.085);

    const done = Promise.all(anims.map(a => a.finished.catch(() => undefined)));
    await Promise.race([done, wait(4000)]);
    this.finishIntro();
  }

  /** Desarma: a página fica no estado final do CSS, sem animação residual. */
  private finishIntro(): void {
    document.documentElement.classList.remove(INTRO_HERO);
    if (this.mastheadArmed) document.documentElement.classList.remove(INTRO_MASTHEAD);
    for (const a of this.animations) a.cancel();
    this.animations = [];
    this.armed = false;
  }
}

/** Data local em yyyy-MM-dd — toISOString() daria o dia em UTC (à noite, o de amanhã). */
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
