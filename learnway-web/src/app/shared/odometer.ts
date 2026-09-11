import {
  ChangeDetectionStrategy, Component, OnDestroy, afterNextRender, computed, input, signal,
} from '@angular/core';

interface Slot { digit: number | null; text: string; }

/**
 * Odômetro: cada dígito é uma fita de 0 a 9 que desliza até parar no número
 * certo, um dígito depois do outro. É o contador dos painéis de estatística —
 * um mecanismo, não um efeito, o que casa com o papel.
 *
 * Nasce em zero e rola para o valor depois de `delay` ms (a home usa isso
 * para encaixar o giro na coreografia de entrada). Valor que muda depois faz
 * a fita deslizar do dígito antigo para o novo. Leitores de tela recebem o
 * número inteiro, não as fitas. Menos movimento = valor direto.
 */
@Component({
  selector: 'lw-odometer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="sr">{{ text() }}</span>
    <span class="row" aria-hidden="true">
      @for (slot of slots(); track $index) {
        @if (slot.digit !== null) {
          <span class="digit">
            <span class="tape"
                  [style.transform]="'translateY(' + (armed() ? -slot.digit * 10 : 0) + '%)'"
                  [style.transition-delay.ms]="$index * 90">
              <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
              <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
            </span>
          </span>
        } @else {
          <span class="sym">{{ slot.text }}</span>
        }
      }
    </span>
  `,
  styles: [`
    :host {
      position: relative;
      display: inline-flex;
      line-height: 1;
      font-variant-numeric: tabular-nums lining-nums;
    }
    .sr {
      position: absolute; width: 1px; height: 1px; overflow: hidden;
      clip: rect(0 0 0 0); white-space: nowrap;
    }
    .row { display: inline-flex; }
    .digit { display: inline-block; height: 1em; overflow: hidden; }
    .tape {
      display: flex; flex-direction: column;
      transition: transform var(--lw-dur-roll) var(--lw-ease-out);
      will-change: transform;
    }
    .tape > span { display: block; height: 1em; line-height: 1; }
  `],
})
export class Odometer implements OnDestroy {
  readonly value = input(0);
  /** Espera (ms) antes do primeiro giro. */
  readonly delay = input(0);

  readonly armed = signal(false);
  /* Sem separador de milhar: em dígitos tabulares o "1" senta no meio de uma
     casa larga e "1.240" lê como "1 .240". */
  readonly text = computed(() => String(Math.round(this.value())));
  readonly slots = computed<Slot[]>(() =>
    Array.from(this.text(), ch => (/\d/.test(ch) ? { digit: Number(ch), text: ch } : { digit: null, text: ch })),
  );

  private timer = 0;

  constructor() {
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.armed.set(true);
        return;
      }
      this.timer = window.setTimeout(() => this.armed.set(true), this.delay());
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
