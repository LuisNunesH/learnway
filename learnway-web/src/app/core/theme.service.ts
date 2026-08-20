import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'lw_theme';

/**
 * Tema claro/escuro. Um script inline em index.html já aplica o atributo
 * data-theme no <html> antes do Angular carregar (evita flash); este
 * serviço só assume esse valor e cuida da alternância + persistência.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(readCurrent());

  constructor() {
    effect(() => {
      const value = this.theme();
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem(STORAGE_KEY, value);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }
}

function readCurrent(): Theme {
  const fromDom = document.documentElement.getAttribute('data-theme');
  if (fromDom === 'light' || fromDom === 'dark') return fromDom;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
