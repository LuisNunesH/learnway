import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Backdrop } from './shared/backdrop';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Backdrop, Toasts],
  template: `
    <lw-backdrop />
    <router-outlet />
    <lw-toasts />
  `,
  // Host em bloco: garante uma cadeia de blocos de contenção sã para os
  // elementos sticky (cabeçalho, sumário da teoria) em qualquer rota.
  styles: [':host { display: block; min-height: 100%; }'],
})
export class App {}
