import { Injectable, NgZone, inject } from '@angular/core';
import gsap from 'gsap';

/** Fração do caminho até o alvo percorrida por quadro (a 60 fps). Menor = mais escorrega. */
const LERP = 0.11;
/** Abaixo desta distância (px) a rolagem encosta no alvo e o laço dorme. */
const SETTLE = 0.3;
/** Desvio (px) entre o que escrevemos e o que o navegador reporta que denuncia
    uma rolagem de fora (barra arrastada, teclado): aí o alvo é ressincronizado. */
const DRIFT = 2;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

/**
 * Rolagem com inércia — a página persegue a roda em vez de saltar para ela.
 *
 * É a rolagem REAL da janela que anda (window.scrollTo), não um translate do
 * conteúdo: cabeçalho sticky, barra de progresso de leitura, timelines de
 * scroll do CSS e o ScrollTrigger do fundo continuam lendo a mesma posição.
 * A roda é interceptada e vira um alvo; o alvo é perseguido por lerp a cada
 * tick do GSAP (laço já compartilhado com o lw-backdrop) e o laço dorme
 * quando encosta, para não custar CPU em repouso.
 *
 * Só existe onde faz sentido: mouse/trackpad em tela grande. Toque, teclado e
 * barra de rolagem seguem nativos — e quando o usuário rola por eles o alvo
 * se realinha em vez de brigar. Quem pede menos movimento não recebe inércia.
 *
 * Liga-se por rota (start no ngOnInit, stop no ngOnDestroy). Hoje só a home
 * usa: numa tela de lição, com enunciado e editor, rolagem que não obedece na
 * hora atrapalha.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private zone = inject(NgZone);

  private target = 0;
  private current = 0;
  private lastWritten = -1;
  private awake = false;
  private cleanups: Array<() => void> = [];
  private readonly tick = (_time: number, delta: number) => this.step(delta);

  get active(): boolean {
    return this.cleanups.length > 0;
  }

  start(): void {
    if (this.active) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    this.zone.runOutsideAngular(() => {
      this.current = this.target = window.scrollY;

      const onWheel = (e: WheelEvent) => {
        // Pinça de zoom, rolagem horizontal e quem já tratou o evento passam direto.
        if (e.ctrlKey || e.defaultPrevented) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        // Caixas com rolagem própria (editor, textarea) mantêm a roda nativa.
        const el = e.target as Element | null;
        if (el?.closest?.('textarea, select, [data-native-scroll], .cm-editor')) return;

        e.preventDefault();
        const dy = e.deltaMode === 1 ? e.deltaY * 16
          : e.deltaMode === 2 ? e.deltaY * window.innerHeight
          : e.deltaY;
        if (!this.awake) this.current = this.target = window.scrollY;
        this.target = clamp(this.target + dy, 0, maxScroll());
        this.wake();
      };

      // Rolagem que não veio de nós (barra, teclado, âncora): realinha o alvo.
      const onScroll = () => {
        if (!this.awake) { this.current = this.target = window.scrollY; return; }
        if (Math.abs(window.scrollY - this.lastWritten) > DRIFT) {
          this.current = this.target = window.scrollY;
          this.sleep();
        }
      };

      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('scroll', onScroll, { passive: true });
      this.cleanups.push(
        () => window.removeEventListener('wheel', onWheel),
        () => window.removeEventListener('scroll', onScroll),
        () => this.sleep(),
      );
    });
  }

  stop(): void {
    for (const off of this.cleanups) off();
    this.cleanups = [];
  }

  private wake(): void {
    if (this.awake) return;
    this.awake = true;
    gsap.ticker.add(this.tick);
  }

  private sleep(): void {
    if (!this.awake) return;
    this.awake = false;
    gsap.ticker.remove(this.tick);
  }

  private step(deltaMs: number): void {
    // Quadros decorridos (independente de FPS); clamp para volta de aba.
    const dt = Math.min(2.5, (deltaMs || 16.667) / 16.667);
    const k = 1 - Math.pow(1 - LERP, dt);
    this.target = clamp(this.target, 0, maxScroll());
    this.current += (this.target - this.current) * k;

    if (Math.abs(this.target - this.current) < SETTLE) {
      this.current = this.target;
      this.write();
      this.sleep();
      return;
    }
    this.write();
  }

  private write(): void {
    this.lastWritten = Math.round(this.current);
    window.scrollTo(0, this.current);
  }
}
