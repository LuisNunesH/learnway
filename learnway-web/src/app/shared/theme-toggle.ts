import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { Icon } from './icon';

/**
 * Alterna papel (claro) e nanquim (escuro).
 *
 * Botão de texto, não de caixa: no sistema editorial o cabeçalho não tem
 * caixinhas, tem tinta e fio. O ícone gira meia volta na troca, que é o
 * único movimento que o gesto pede.
 */
@Component({
  selector: 'lw-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button type="button" class="toggle" (click)="theme.toggle()"
            [attr.aria-pressed]="theme.theme() === 'dark'"
            [attr.aria-label]="theme.theme() === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
            [title]="theme.theme() === 'dark' ? 'Tema claro' : 'Tema escuro'">
      <!-- @if/@else em vez de [name] dinâmico: assim o ícone é um elemento
           NOVO a cada troca e a animação de meia volta roda de novo. -->
      @if (theme.theme() === 'dark') {
        <lw-icon name="sun" [size]="16" />
      } @else {
        <lw-icon name="moon" [size]="16" />
      }
    </button>
  `,
  styles: [`
    .toggle {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px;
      padding: 0;
      border: none;
      border-radius: var(--lw-radius-sm);
      background: none;
      color: var(--lw-ink-faint);
      cursor: pointer;
      transition: color var(--lw-dur-fast) var(--lw-ease),
                  background var(--lw-dur-fast) var(--lw-ease);

      &:hover { color: var(--lw-accent); background: var(--lw-surface-nav); }
    }

    /* No toque o alvo precisa de 44px, mas o botão de 30px é o que o
       cabeçalho editorial comporta. Então cresce só a área sensível, num
       pseudo-elemento centrado: a tinta não muda de tamanho e o polegar
       passa a acertar. O corte é por pointer: coarse, e não por largura —
       o que decide é o dedo, não a tela (tablet com caneta continua fino). */
    @media (pointer: coarse) {
      .toggle::after {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 44px; height: 44px;
      }
      .toggle { position: relative; }
    }

    /* A meia volta acontece na troca do ícone, sem estado extra. */
    lw-icon {
      display: flex;
      animation: lw-theme-turn var(--lw-dur) var(--lw-ease-out);
    }
    @keyframes lw-theme-turn {
      from { transform: rotate(-180deg); opacity: 0; }
      to   { transform: rotate(0);       opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      lw-icon { animation: none; }
    }
  `],
})
export class ThemeToggle {
  readonly theme = inject(ThemeService);
}
