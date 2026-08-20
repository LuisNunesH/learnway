# Scroll suave + animação por scroll no Angular

O efeito que você viu no site da Dragonfly são **quatro coisas separadas**, e cada
uma se resolve sozinha. Não existe uma biblioteca única que faz tudo.

| O que você viu | O que é | Como resolve |
|---|---|---|
| Rolagem "pesada", com inércia | smooth scroll | biblioteca **Lenis** |
| Sem barra de rolagem | CSS puro | 2 linhas (já estão no `_tokens.css`) |
| Animação que anda com o scroll | scroll-driven animation | **CSS nativo**, sem biblioteca |
| Menu fixo em pill | CSS puro | `position: fixed` + `backdrop-filter` |

---

## Antes de tudo: onde isso pode existir

**Landing page: sim. Dentro do app: não.**

Scroll com inércia numa tela onde a pessoa está lendo um enunciado e digitando
resposta atrapalha de verdade — o scroll não obedece na hora, o textarea briga
com o container, e teclado no mobile fica imprevisível. Barra de rolagem
escondida numa lista longa de questões é pior ainda.

Então: **Lenis só na rota da landing.** O resto do app usa scroll normal do
navegador, com os mesmos tokens e a mesma cara. Ninguém vai achar estranho — é
exatamente o que a Vercel, a Linear e a própria Dragonfly fazem.

Isso também corta seu trabalho pela metade.

---

## 1. Barra de rolagem escondida

Já está no `_tokens.css`:

```css
html { scrollbar-width: none; }
html::-webkit-scrollbar { display: none; }
```

**Compense com uma barra de progresso.** Sem a scrollbar a pessoa perde a noção
de onde está na página. Isso é CSS puro, sem JS:

```css
.lw-scroll-progress {
  position: fixed;
  inset: 0 0 auto 0;
  height: 2px;
  background: var(--lw-orange);
  transform-origin: 0 50%;
  z-index: 100;

  animation: lw-progress linear both;
  animation-timeline: scroll(root block);
}

@keyframes lw-progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

---

## 2. Animação que acompanha o scroll — CSS nativo

Isso **não precisa de GSAP nem de biblioteca nenhuma** hoje. Chrome e Edge têm
desde a versão 115 (2023) e o Safari 26 também. O Firefox ainda está atrás de
flag, mas degrada sozinho: o navegador ignora `animation-timeline` e o elemento
simplesmente aparece no estado final.

Duas funções, e escolher a certa é 90% do trabalho:

- `scroll()` — segue o progresso da **página inteira** (use na barra de progresso, no menu que encolhe)
- `view()` — segue a passagem **de um elemento** pela viewport (use nos blocos que aparecem ao rolar)

**Bloco que revela ao entrar na tela:**

```css
.lw-reveal {
  animation: lw-reveal linear both;
  animation-timeline: view();
  animation-range: entry 10% cover 35%;
}

@keyframes lw-reveal {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: none; }
}

/* fallback explícito e reduced-motion */
@supports not (animation-timeline: view()) {
  .lw-reveal { animation: none; opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .lw-reveal { animation: none; opacity: 1; transform: none; }
}
```

Usar: `<section class="lw-reveal">`. Só isso.

**⚠ Detalhe de Angular:** coloque essas classes em `styles.scss` **global**, não
no SCSS do componente. `ViewEncapsulation` escopa o seletor e timeline nomeada
que atravessa componente quebra de um jeito difícil de debugar.

---

## 3. Smooth scroll com Lenis

```bash
npm install lenis
```

```ts
// src/app/core/smooth-scroll.service.ts
import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import Lenis from 'lenis';

@Injectable({ providedIn: 'root' })
export class SmoothScrollService implements OnDestroy {
  private zone = inject(NgZone);
  private lenis?: Lenis;
  private rafId?: number;

  start(): void {
    if (this.lenis) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // FORA da zone: senão o Angular roda change detection 60x por segundo
    this.zone.runOutsideAngular(() => {
      this.lenis = new Lenis({ duration: 1.2, smoothWheel: true });

      const raf = (time: number) => {
        this.lenis!.raf(time);
        this.rafId = requestAnimationFrame(raf);
      };
      this.rafId = requestAnimationFrame(raf);
    });
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lenis?.destroy();
    this.lenis = undefined;
    this.rafId = undefined;
  }

  ngOnDestroy(): void { this.stop(); }
}
```

**O `runOutsideAngular` é a linha que importa.** Sem ela o loop de animação
dispara change detection a cada frame e o app inteiro fica lento — é o erro
clássico de integrar biblioteca de animação em Angular.

Ligar só na landing:

```ts
// landing.component.ts
export class LandingComponent implements OnInit, OnDestroy {
  private scroll = inject(SmoothScrollService);
  ngOnInit()    { this.scroll.start(); }
  ngOnDestroy() { this.scroll.stop(); }   // sai da landing, volta ao normal
}
```

E o CSS do Lenis, no `styles.scss`:

```scss
@use 'lenis/dist/lenis.css';
```

---

## 4. Menu fixo em pill

Direto dos valores da extração — o tint `rgba(242,242,242,0.06)` e o `blur(6px)`
são exatamente os do site original:

```scss
.lw-nav {
  position: fixed;
  inset-block-start: var(--lw-space-xl);
  inset-inline: var(--lw-space-xl);
  z-index: 90;

  display: flex;
  align-items: center;
  gap: var(--lw-space-lg);
  padding: var(--lw-space-md) var(--lw-space-xl);

  background: var(--lw-surface-nav);
  backdrop-filter: blur(var(--lw-blur-nav));
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-radius);

  font-family: var(--lw-font-mono);
  font-size: var(--lw-text-micro);
  letter-spacing: var(--lw-tracking-micro);
  text-transform: uppercase;
  color: var(--lw-text);
}
```

Os micro-labels em mono, 10px, caixa alta, com aquele tracking positivo de
`0.4px` — **isso é o que faz parecer o site de referência**, mais do que
qualquer animação. É o detalhe mais barato e de maior retorno do pacote todo.

**Menu que encolhe ao rolar**, também sem JS:

```css
.lw-nav {
  animation: lw-nav-shrink linear both;
  animation-timeline: scroll(root block);
  animation-range: 0 200px;
}

@keyframes lw-nav-shrink {
  to { padding: var(--lw-space-sm) var(--lw-space-lg); }
}
```

---

## Ordem prática de implementação

1. Cola o `_tokens.css` e importa no `styles.scss` — **teste antes de continuar**:
   pinte o `body` de `--lw-surface-0` e um texto de `--lw-text`. Se ficou preto
   com off-white, os tokens estão vivos.
2. Carrega as três fontes do Google Fonts no `index.html`
3. Monta a `.lw-nav` — é o que mais muda a percepção, e é só CSS
4. Adiciona `.lw-scroll-progress` e `.lw-reveal` globais
5. Instala o Lenis e liga **só na landing**
6. Só então parte pros componentes do app (botão → card de questão → feedback)

Os passos 1 a 4 são uma tarde e já mudam o app inteiro de cara. O passo 5 é
opcional. O passo 6 é o trabalho de verdade.
