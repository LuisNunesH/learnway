import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { Icon } from './icon';

/** Botão circular que alterna entre tema claro e escuro. */
@Component({
  selector: 'lw-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button type="button" class="toggle" (click)="theme.toggle()"
            [attr.aria-label]="theme.theme() === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
            [title]="theme.theme() === 'dark' ? 'Tema claro' : 'Tema escuro'">
      <lw-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="17" />
    </button>
  `,
  styles: [`
    .toggle {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      border-radius: 10px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      &:hover { color: var(--color-primary); border-color: var(--color-primary); }
    }
  `],
})
export class ThemeToggle {
  readonly theme = inject(ThemeService);
}
