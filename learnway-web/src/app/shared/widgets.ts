import {
  ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, signal, untracked,
} from '@angular/core';
import { Icon } from './icon';
import { UrgencyLevel } from '../core/models';

/**
 * Número que sobe até o valor. Usado nos grandes numerais de XP/streak: o
 * contador dá peso à conquista sem precisar de cor nem de brilho. Respeita
 * `prefers-reduced-motion` (aí o valor aparece direto).
 */
@Component({
  selector: 'lw-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ display() }}`,
  styles: [`:host { font-variant-numeric: tabular-nums lining-nums; }`],
})
export class CountUp implements OnDestroy {
  readonly value = input(0);
  readonly duration = input(900);

  private readonly current = signal(0);
  readonly display = computed(() => Math.round(this.current()));

  private frame = 0;

  constructor() {
    effect(() => {
      const target = this.value();
      // `current` é lido sem criar dependência: senão o efeito se realimenta.
      const from = untracked(() => this.current());
      cancelAnimationFrame(this.frame);

      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.current.set(target);
        return;
      }

      const dur = untracked(() => this.duration());
      const started = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - started) / dur);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cúbico
        this.current.set(from + (target - from) * eased);
        if (p < 1) this.frame = requestAnimationFrame(step);
      };
      this.frame = requestAnimationFrame(step);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
  }
}

/**
 * Barra de progresso. No sistema "Papel" ela é uma RÉGUA que se preenche:
 * trilho em papel rebaixado, preenchimento chapado em tinta. O terracota fica
 * reservado à ação principal da tela, então o progresso padrão usa tinta;
 * `success` usa o verde de avaliação.
 */
@Component({
  selector: 'lw-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="track" [style.height.px]="height()">
      <div class="fill" [style.width.%]="clamped()" [class.fill--success]="color() === 'success'"></div>
    </div>
  `,
  styles: [`
    .track {
      width: 100%;
      background: var(--lw-paper-deep);
      border-radius: 999px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background: var(--lw-ink);
      border-radius: 999px;
      transition: width var(--lw-dur-slow) var(--lw-ease-out);
    }
    .fill--success { background: var(--lw-eval-correct); }
  `],
})
export class ProgressBar {
  readonly value = input(0);
  readonly height = input(6);
  readonly color = input<'primary' | 'success'>('primary');
  readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));
}

/** Cristal de conhecimento — a mecânica visual da revisão espaçada. */
@Component({
  selector: 'lw-crystal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `<span class="crystal" [class]="'crystal--' + state()"><lw-icon name="gem" [size]="size()" /></span>`,
  styles: [`
    :host { display: inline-flex; line-height: 0; }
    .crystal { display: inline-flex; }
    .crystal--fresh   { color: var(--lw-eval-correct); }
    .crystal--dim     { color: var(--lw-eval-partial); }
    .crystal--hungry  { color: var(--lw-eval-wrong); animation: lw-crystal-alarm 1.5s var(--lw-ease) infinite; }
    .crystal--off     { color: var(--lw-ink-faint); }
  `],
})
export class Crystal {
  readonly urgency = input<UrgencyLevel | null | undefined>(undefined);
  readonly size = input(20);

  readonly state = computed(() => {
    switch (this.urgency()) {
      case 'OVERDUE': return 'hungry';
      case 'DUE_TODAY': return 'dim';
      case 'NORMAL': return 'fresh';
      default: return 'off';
    }
  });
}

/** Pontos de dificuldade (1–5) — pingos de tinta na margem. */
@Component({
  selector: 'lw-difficulty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (dot of dots(); track $index) {
      <span class="dot" [class.dot--on]="dot"></span>
    }
  `,
  styles: [`
    :host { display: inline-flex; gap: 3px; align-items: center; }
    .dot { width: 5px; height: 5px; border-radius: 999px; background: var(--lw-paper-deep); }
    .dot--on { background: var(--lw-ink); }
  `],
})
export class Difficulty {
  readonly level = input<number | null | undefined>(1);
  readonly dots = computed(() => Array.from({ length: 5 }, (_, i) => i < (this.level() ?? 1)));
}

/** Spinner — movimento transitório para carregamentos. */
@Component({
  selector: 'lw-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="spin" [style.width.px]="size()" [style.height.px]="size()"></span>`,
  styles: [`
    .spin {
      display: inline-block;
      border: 2px solid var(--lw-paper-deep);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: lw-spin 0.7s linear infinite;
    }
  `],
})
export class Spinner {
  readonly size = input(16);
}

/** Avatar — retrato de canto discreto; a inicial vem na serifa de display. */
@Component({
  selector: 'lw-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (url()) {
      <img [src]="url()" [style.width.px]="size()" [style.height.px]="size()" alt="avatar" />
    } @else {
      <span class="fallback" [style.width.px]="size()" [style.height.px]="size()"
            [style.fontSize.px]="size() * 0.46">{{ initial() }}</span>
    }
  `,
  styles: [`
    :host { display: inline-flex; line-height: 0; }
    img, .fallback { border-radius: var(--lw-radius-sm); object-fit: cover; }
    img { border: 1px solid var(--lw-rule); }
    .fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--lw-paper-sunken);
      border: 1px solid var(--lw-rule-strong);
      color: var(--lw-ink);
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-weight: 600;
      line-height: 1;
      text-transform: uppercase;
    }
  `],
})
export class Avatar {
  readonly name = input('');
  readonly url = input<string | null | undefined>(null);
  readonly size = input(36);
  readonly initial = computed(() => (this.name() || '?').charAt(0));
}

/** Estado vazio reutilizável — folha em branco com uma nota de margem. */
@Component({
  selector: 'lw-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="empty">
      <div class="empty__icon" aria-hidden="true"><lw-icon [name]="icon()" [size]="26" /></div>
      <span class="lw-label">{{ eyebrow() }}</span>
      <h3>{{ title() }}</h3>
      @if (message()) { <p class="muted">{{ message() }}</p> }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--lw-space-sm);
      text-align: center;
      padding: var(--lw-space-2xl) var(--lw-space-xl);
    }
    .empty__icon {
      width: 56px; height: 56px;
      margin-bottom: var(--lw-space-xs);
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      background: var(--lw-paper-sunken);
      border: 1px solid var(--lw-rule);
      color: var(--lw-ink-faint);
    }
    h3 { font-size: var(--lw-text-h2); font-weight: 500; }
    p {
      max-width: 42ch;
      font-family: var(--lw-font-prose);
      font-size: var(--lw-text-body);
      line-height: 1.6;
    }
  `],
})
export class Empty {
  readonly icon = input('sparkles');
  readonly eyebrow = input('vazio');
  readonly title = input('Nada por aqui');
  readonly message = input<string | undefined>(undefined);
}
