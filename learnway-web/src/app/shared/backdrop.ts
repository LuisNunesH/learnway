import {
  ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy,
  afterNextRender, inject, viewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Lê um token de cor do :root e devolve o trio RGB (o canvas não entende var()). */
function tokenRgb(name: string, fallback: [number, number, number]): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Plano de fundo ambiente do app (atrás de TODAS as páginas), dirigido por GSAP.
 *
 * No sistema "Papel" o fundo não é um túnel: é a PÁGINA em si. Um <canvas> fixo
 * desenha a infraestrutura invisível de uma diagramação editorial —
 *
 *  - colunas          → as guias verticais da grade, fixas, quase imperceptíveis;
 *  - pauta            → linhas de base horizontais que deslizam com a leitura;
 *  - marginália       → traços curtos de régua nas duas margens;
 *  - grão             → textura de papel, tile de ruído gerado uma vez.
 *
 * O GSAP continua sendo o motor, com os mesmos gatilhos de antes:
 *  - `gsap.ticker`   → laço de render único do app;
 *  - `ScrollTrigger` → velocidade + progresso da rolagem real da página;
 *  - roda do mouse   → gatilho universal (funciona em tela que não rola);
 *  - `gsap.quickTo`  → paralaxe suave da grade atrás do cursor.
 *
 * A diferença é de VOLUME: rolar não dispara um warp, faz a pauta deslizar e
 * uma faixa de linhas acender em terracota — como o olho correndo pela coluna.
 * Em repouso, o papel volta a ficar parado. Vira grade estática quando o
 * usuário pede menos movimento.
 */
@Component({
  selector: 'lw-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #cv class="backdrop" aria-hidden="true"></canvas>`,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: none;
    }
  `],
})
export class Backdrop implements OnDestroy {
  private zone = inject(NgZone);
  private router = inject(Router);
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');

  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private reduced = false;

  // ---- tinta (lida dos tokens, para não divergir do tema) ----
  private ink: [number, number, number] = [25, 23, 20];
  private accent: [number, number, number] = [176, 71, 43];

  // ---- geometria da diagramação ----
  private readonly columns = 12;      // guias verticais da grade
  private readonly gridWidth = 1080;  // casa com --lw-page-width
  private readonly gutter = 28;       // casa com --lw-space-xl
  private readonly lineGap = 76;      // altura da pauta
  private readonly tickLen = 14;      // traço de marginália

  // ---- intensidades (todas baixas: isto é fundo, não conteúdo) ----
  private readonly colAlpha = 0.05;   // guia de coluna
  private readonly ruleAlpha = 0.055; // linha de pauta
  private readonly grainAlpha = 0.5;  // opacidade do tile de grão
  private readonly idleDrift = 0.06;  // deriva contínua da pauta (px/frame)
  private readonly wheelGain = 0.30;  // deslize por pixel de roda
  private readonly scrollGain = 0.008;// deslize por px/s de rolagem
  private readonly maxShift = 10;     // paralaxe máxima pelo cursor (px)

  // ---- estado dinâmico (shiftX/shiftY são tweenados pelo GSAP) ----
  private readonly grid = { travel: 0, target: 0, shiftX: 0, shiftY: 0 };
  private energy = 0;   // faixa de leitura acesa pela velocidade (0..1), decai
  private ptrY = -9999;
  private ptrX = -9999;
  private ptrActive = 0;
  private ptrTarget = 0;

  private grain: HTMLCanvasElement | null = null;
  private grainPattern: CanvasPattern | null = null;

  private shiftXTo?: (v: number) => void;
  private shiftYTo?: (v: number) => void;
  private tick?: (time: number, delta: number) => void;
  private st?: ScrollTrigger;
  private cleanups: Array<() => void> = [];

  constructor() {
    afterNextRender(() => this.init());
  }

  private init(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ink = tokenRgb('--lw-ink', this.ink);
    this.accent = tokenRgb('--lw-accent', this.accent);
    this.buildGrain();
    this.resize();

    this.zone.runOutsideAngular(() => {
      const onMove = (e: PointerEvent) => {
        this.ptrX = e.clientX;
        this.ptrY = e.clientY;
        this.ptrTarget = 1;
      };
      const onLeave = () => { this.ptrTarget = 0; };
      // A roda é o gatilho universal — existe mesmo em tela que não rola.
      const onWheel = (e: WheelEvent) => {
        const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; // linhas → px
        this.grid.target += dy * this.wheelGain;
        this.kick(Math.abs(dy) * 0.006);
      };
      const onResize = () => { this.resize(); this.st?.refresh(); };

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave);
      window.addEventListener('blur', onLeave);
      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('resize', onResize);

      this.cleanups.push(
        () => window.removeEventListener('pointermove', onMove),
        () => window.removeEventListener('pointerdown', onMove),
        () => document.removeEventListener('pointerleave', onLeave),
        () => window.removeEventListener('blur', onLeave),
        () => window.removeEventListener('wheel', onWheel),
        () => window.removeEventListener('resize', onResize),
      );

      // Menos movimento: grade estática, sem GSAP, sem laço.
      if (this.reduced) { this.draw(); return; }

      // Paralaxe suave (eased) da grade atrás do cursor.
      this.shiftXTo = gsap.quickTo(this.grid, 'shiftX', { duration: 0.9, ease: 'power2' });
      this.shiftYTo = gsap.quickTo(this.grid, 'shiftY', { duration: 0.9, ease: 'power2' });

      // ScrollTrigger: a rolagem real vira deslize da pauta + faixa acesa.
      this.st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const v = self.getVelocity();            // px/s, com sinal
          this.grid.target += v * this.scrollGain;
          this.kick(Math.min(1, Math.abs(v) * 0.0006));
        },
      });

      // A altura do conteúdo muda a cada rota → recalibra o ScrollTrigger.
      const sub = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
      this.cleanups.push(() => sub.unsubscribe());

      this.tick = (_time: number, delta: number) => this.frame(delta);
      gsap.ticker.add(this.tick);
    });
  }

  /** Acende a faixa de leitura (0..1); decai a cada frame. */
  private kick(amount: number): void {
    this.energy = Math.min(1, this.energy + amount);
  }

  /**
   * Grão de papel: um tile 96×96 de ruído monocromático gerado uma única vez e
   * repetido como pattern. Custa um fillRect por frame.
   */
  private buildGrain(): void {
    const size = 96;
    const tile = document.createElement('canvas');
    tile.width = size;
    tile.height = size;
    const tctx = tile.getContext('2d');
    if (!tctx) return;

    const img = tctx.createImageData(size, size);
    const [r, g, b] = this.ink;
    for (let i = 0; i < img.data.length; i += 4) {
      // Ruído esparso e fraco: só ~18% dos pixels recebem tinta.
      const on = Math.random() < 0.18;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = on ? 4 + Math.random() * 7 : 0;
    }
    tctx.putImageData(img, 0, 0);
    this.grain = tile;
    this.grainPattern = this.ctx?.createPattern(tile, 'repeat') ?? null;
  }

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    if (!this.ctx) return;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(this.w * this.dpr);
    canvas.height = Math.floor(this.h * this.dpr);
    canvas.style.width = `${this.w}px`;
    canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.grain && !this.grainPattern) {
      this.grainPattern = this.ctx.createPattern(this.grain, 'repeat');
    }
    if (this.reduced) this.draw();
  }

  private frame(deltaMs: number): void {
    // Frames decorridos (independente de FPS); clamp para troca de aba.
    const dt = Math.min(2.5, (deltaMs || 16.667) / 16.667);

    this.ptrActive += (this.ptrTarget - this.ptrActive) * (1 - Math.pow(0.93, dt));

    // Deriva contínua + inércia: travel persegue target (scrub).
    this.grid.target += this.idleDrift * dt;
    this.grid.travel += (this.grid.target - this.grid.travel) * (1 - Math.pow(0.88, dt));

    // Mantém os números pequenos sem alterar a fase da pauta.
    if (this.grid.travel > 1e6) {
      const k = Math.floor(this.grid.travel / this.lineGap) * this.lineGap;
      this.grid.travel -= k;
      this.grid.target -= k;
    }

    this.energy *= Math.pow(0.93, dt);

    // Paralaxe: a grade se desloca de leve na direção oposta ao cursor.
    if (this.ptrX > -9000) {
      const nx = (this.ptrX - this.w / 2) / (this.w / 2);
      const ny = (this.ptrY - this.h / 2) / (this.h / 2);
      this.shiftXTo?.(-nx * this.maxShift * this.ptrActive);
      this.shiftYTo?.(-ny * this.maxShift * 0.6 * this.ptrActive);
    }

    this.draw();
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { w, h, lineGap, tickLen } = this;
    ctx.clearRect(0, 0, w, h);

    const [ir, ig, ib] = this.ink;
    const [ar, ag, ab] = this.accent;
    const energy = this.energy;
    const sx = this.grid.shiftX;
    const sy = this.grid.shiftY;

    // ---- 1. grão do papel ----
    if (this.grainPattern) {
      ctx.globalAlpha = this.grainAlpha;
      ctx.fillStyle = this.grainPattern;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // ---- 2. guias verticais da grade editorial ----
    const gridW = Math.min(this.gridWidth, w - this.gutter * 2);
    const left = (w - gridW) / 2;
    const step = gridW / this.columns;
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.columns; i++) {
      // As guias das extremidades são as margens: um tom mais presentes.
      const edge = i === 0 || i === this.columns;
      ctx.strokeStyle = `rgba(${ir}, ${ig}, ${ib}, ${this.colAlpha * (edge ? 1.6 : 1)})`;
      const x = Math.round(left + i * step + sx * (edge ? 0.4 : 1)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // ---- 3. pauta + marginália ----
    // A faixa acesa fica onde o olho está: no cursor, ou no meio da tela.
    const focus = this.ptrY > -9000 ? this.ptrY : h * 0.5;
    const offset = ((this.grid.travel % lineGap) + lineGap) % lineGap;
    const marginL = left - this.gutter;
    const marginR = left + gridW + this.gutter;

    for (let y = -offset; y < h + lineGap; y += lineGap) {
      const py = Math.round(y + sy) + 0.5;
      if (py < -2 || py > h + 2) continue;

      // Quanto mais perto da faixa de leitura, mais a linha existe.
      const near = Math.max(0, 1 - Math.abs(py - focus) / (h * 0.42));
      const heat = energy * near * this.ptrActiveOrOne();

      const a = this.ruleAlpha + near * 0.03 + heat * 0.10;
      ctx.strokeStyle = heat > 0.02
        ? `rgba(${ar}, ${ag}, ${ab}, ${a})`
        : `rgba(${ir}, ${ig}, ${ib}, ${a})`;
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(left + gridW, py);
      ctx.stroke();

      // Traços de régua nas margens — o detalhe que denuncia a diagramação.
      ctx.strokeStyle = `rgba(${ir}, ${ig}, ${ib}, ${this.ruleAlpha * 1.8 + heat * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(marginL - tickLen, py);
      ctx.lineTo(marginL, py);
      ctx.moveTo(marginR, py);
      ctx.lineTo(marginR + tickLen, py);
      ctx.stroke();
    }
  }

  /** Sem cursor (toque, teclado) a faixa acende assim mesmo. */
  private ptrActiveOrOne(): number {
    return this.ptrX > -9000 ? Math.max(0.55, this.ptrActive) : 1;
  }

  ngOnDestroy(): void {
    if (this.tick) gsap.ticker.remove(this.tick);
    this.st?.kill();
    for (const off of this.cleanups) off();
    this.cleanups = [];
  }
}
