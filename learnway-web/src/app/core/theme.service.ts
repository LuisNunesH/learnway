import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'lw_theme';

/** Cor da barra do navegador por tema — espelha --lw-paper dos tokens. */
const THEME_COLOR: Record<Theme, string> = {
  light: '#faf8f3',
  dark: '#0c0b0b',
};

/**
 * Tema claro ("Papel") / escuro ("Nanquim").
 *
 * Um script inline em index.html já aplica data-theme no <html> antes da
 * primeira pintura (senão a página pisca clara antes de virar nanquim);
 * este serviço assume esse valor e cuida da alternância, da persistência
 * e da meta theme-color.
 *
 * Enquanto o usuário NÃO escolher explicitamente, o app segue o sistema
 * operacional ao vivo — quem alterna o tema do SO ao anoitecer vê o app
 * acompanhar. Um clique no botão encerra esse acompanhamento: escolha
 * explícita vence para sempre (é o que está no localStorage).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(readCurrent());

  /** True quando o valor atual veio de um clique, não do sistema. */
  private explicit = isExplicit();

  constructor() {
    effect(() => {
      const value = this.theme();
      document.documentElement.setAttribute('data-theme', value);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', THEME_COLOR[value]);
      if (this.explicit) localStorage.setItem(STORAGE_KEY, value);
    });

    window
      .matchMedia?.('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!this.explicit) this.theme.set(e.matches ? 'dark' : 'light');
      });
  }

  toggle(): void {
    this.explicit = true;
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}

function isExplicit(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark';
}

function readCurrent(): Theme {
  const fromDom = document.documentElement.getAttribute('data-theme');
  if (fromDom === 'light' || fromDom === 'dark') return fromDom;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
