import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../shared/icon';

/**
 * Composição decorativa do painel de marca (login/registro).
 * Sistema "Papel": gema desenhada a traço de tinta terracota, duas etiquetas
 * mono e uma ficha de código em papel rebaixado — como recortes colados na
 * capa. Escondida de leitores de tela.
 */
@Component({
  selector: 'lw-auth-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="art" aria-hidden="true">
      <svg class="art__gem" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
           stroke="var(--lw-accent)" stroke-width="1.5" stroke-linejoin="round">
        <path d="M60 55 H140 L100 95 Z" />
        <path d="M60 55 L30 95 H100 Z" />
        <path d="M140 55 L170 95 H100 Z" />
        <path d="M30 95 H100 V175 Z" />
        <path d="M170 95 H100 V175 Z" />
        <path d="M30 95 H170" />
      </svg>

      <div class="art__chip art__chip--xp"><lw-icon name="zap" [size]="13" /> +50 XP</div>
      <div class="art__chip art__chip--streak"><lw-icon name="flame" [size]="13" /> 7 DIAS</div>

      <div class="art__code mono">
        <span class="ln"><i class="k">class</i> <i class="t">Dev</i> &#123;</span>
        <span class="ln">&nbsp;&nbsp;<i class="k">int</i> xp = <i class="n">9000</i>;</span>
        <span class="ln">&#125;</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      right: var(--lw-space-2xl);
      bottom: var(--lw-space-2xl);
      pointer-events: none;
      user-select: none;
    }
    .art { position: relative; width: 250px; height: 230px; }

    .art__gem {
      position: absolute;
      right: 10px;
      top: 0;
      width: 180px;
      animation: lw-float 5.5s ease-in-out infinite;
    }

    .art__chip {
      position: absolute;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 11px;
      border-radius: 999px;
      font-family: var(--lw-font-mono);
      font-size: 10.5px;
      letter-spacing: var(--lw-tracking-micro);
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      box-shadow: var(--lw-lift-sm);
    }
    .art__chip--xp {
      left: -12px; top: 26px;
      color: var(--lw-accent);
      animation: lw-float 4.4s ease-in-out 0.6s infinite;
    }
    .art__chip--streak {
      right: -8px; top: 120px;
      color: var(--lw-streak);
      animation: lw-float 5s ease-in-out 1.4s infinite;
    }

    .art__code {
      position: absolute;
      left: -6px; bottom: -8px;
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      border-radius: var(--lw-radius);
      font-size: 12px;
      line-height: 1.7;
      background: var(--lw-code-bg);
      border: 1px solid var(--lw-rule);
      box-shadow: var(--lw-lift-sm);
      animation: lw-float 6s ease-in-out 2.1s infinite;

      i { font-style: normal; }
      .k { color: var(--lw-code-kw); font-weight: 600; }
      .t { color: var(--lw-code-type); }
      .n { color: var(--lw-code-num); }
    }

    @media (prefers-reduced-motion: reduce) {
      .art__gem, .art__chip, .art__code { animation: none; }
    }
    @media (max-height: 700px) {
      :host { display: none; }
    }
  `],
})
export class AuthArt {}
