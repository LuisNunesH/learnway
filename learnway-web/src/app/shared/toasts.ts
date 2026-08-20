import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from './icon';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'lw-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="stack">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast anim-pop" [class]="'toast toast--' + t.kind" (click)="toasts.dismiss(t.id)">
          <span class="toast__icon"><lw-icon [name]="t.icon ?? 'sparkles'" [size]="18" /></span>
          <span class="toast__body">
            <strong>{{ t.title }}</strong>
            @if (t.message) { <span class="toast__msg">{{ t.message }}</span> }
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .stack {
      position: fixed;
      bottom: var(--lw-space-xl);
      right: var(--lw-space-xl);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: var(--lw-space-sm);
      max-width: min(380px, calc(100vw - 32px));
    }
    /* O toast flutua sobre a página — por isso ganha sombra, e um fio
       colorido na lateral esquerda diz de que tipo ele é. */
    .toast {
      display: flex;
      gap: var(--lw-space-md);
      align-items: flex-start;
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-left: 3px solid var(--lw-ink-faint);
      border-radius: var(--lw-radius);
      box-shadow: var(--lw-lift);
      padding: var(--lw-space-md) var(--lw-space-lg);
      cursor: pointer;
      transition: transform var(--lw-dur-fast) var(--lw-ease);
      &:hover { transform: translateX(-2px); }
    }
    .toast__icon {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; flex-shrink: 0;
      color: var(--lw-ink-faint);
    }
    .toast__body { display: flex; flex-direction: column; gap: 1px; font-size: 13.5px; min-width: 0; }
    .toast__msg { color: var(--lw-ink-muted); }
    strong {
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-size: var(--lw-text-h3);
      font-weight: 600;
      line-height: 1.2;
    }

    .toast--success { border-left-color: var(--lw-eval-correct); }
    .toast--success .toast__icon { color: var(--lw-eval-correct); }
    .toast--error   { border-left-color: var(--lw-eval-wrong); }
    .toast--error .toast__icon   { color: var(--lw-eval-wrong); }
    .toast--info    { border-left-color: var(--lw-ink); }
    .toast--info .toast__icon    { color: var(--lw-ink); }
    .toast--xp      { border-left-color: var(--lw-accent); }
    .toast--xp .toast__icon      { color: var(--lw-accent); }
    .toast--xp strong            { color: var(--lw-accent-deep); font-variant-numeric: tabular-nums; }
    .toast--achievement          { border-left-color: var(--lw-eval-partial); }
    .toast--achievement .toast__icon { color: var(--lw-eval-partial); }
  `],
})
export class Toasts {
  readonly toasts = inject(ToastService);
}
