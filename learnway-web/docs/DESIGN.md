# DESIGN.md — LearnWay

Contrato de estilo. **Leia este arquivo antes de gerar ou alterar qualquer UI.**

Fonte da verdade dos valores: `src/styles/_tokens.css`.
Este documento diz *quando* usar cada token. Nunca duplique valores aqui — se
precisar de um hex, ele está lá.

---

## 1. Identidade

O LearnWay é uma plataforma de estudo gamificada: o usuário responde questões
abertas e recebe avaliação por IA.

A direção visual é **flat, alto contraste, editorial**: canvas preto puro, um
único laranja de marca, tipografia com tracking negativo apertado, e micro-labels
em monoespaçada caixa-alta. Sem sombra, sem gradiente, sem degradê. Profundidade
se comunica com tinta e borda, nunca com elevação.

**Elemento-assinatura:** a transição de avaliação — o instante entre o usuário
enviar a resposta e receber o veredito. É o momento de maior carga emocional do
produto e é onde a ousadia visual deve ser gasta. Todo o resto é disciplinado.

---

## 2. Regras de cor

- `--lw-orange` é a marca. **Uma ocorrência por tela**, na ação mais importante.
  Não use em estado de avaliação, não use em decoração.
- Estados de avaliação usam **exclusivamente** os tokens `--lw-eval-*`. Nunca cor
  literal, nunca o laranja da marca.
- `--lw-eval-pending` não tem cor própria de propósito: "avaliando" se comunica
  por **movimento**, não por cor.
- `--lw-level` (roxo) tem contraste 2.8:1. **Só fundo ou borda. Nunca texto.**
- Camadas: `--lw-surface-0` página, `-1` card, `-2` card sobre card / modal.
  Separação por `--lw-border`, jamais por sombra.

## 3. Regras de tipografia

- `--lw-font-grotesk` — UI, botões, títulos, corpo de texto. É a fonte padrão.
- `--lw-font-roman` — display editorial e citações. Uso raro, só momento de peso.
- `--lw-font-mono` — micro-labels: status, metadado, numeração, label de nav.
  Sempre `text-transform: uppercase` + `--lw-tracking-micro`.

O tracking negativo nos tamanhos grandes e o micro-label em mono são **as duas
coisas que definem a identidade**. Não normalize nenhuma das duas.

## 4. Forma e foco

- Um raio só: `--lw-radius` (4px). **Nunca misture cantos arredondados e retos na
  mesma tela** — nem pill, nem círculo, nem `border-radius: 0` isolado.
- Foco visível obrigatório em todo elemento interativo, usando
  `--lw-focus-width` / `--lw-focus-offset` / `--lw-focus-color`.

## 5. Espaçamento

Somente a escala `--lw-space-*` (grid de 4px). Nenhum valor solto.
`--lw-space-section` (180px) é **exclusivo da landing** — nunca dentro do app.

---

## 6. Convenções de código (Angular)

- Standalone components, sem NgModule
- `ChangeDetectionStrategy.OnPush` sempre
- `input()` / `output()` como signals
- SCSS por componente; **zero hex, zero px solto** — apenas `var(--lw-*)`
- Componentes base em `src/app/shared/ui/`, prefixo `lw-`
- Classes de animação por scroll ficam em `styles.scss` **global** — timeline
  nomeada quebra com `ViewEncapsulation`
- Ícones: Lucide. Ilustrações: `src/assets/illustrations/`
- Respeitar `prefers-reduced-motion` em qualquer animação
- Alvo de toque mínimo 44×44px no mobile

---

## 7. Componentes base

Construir nesta ordem. Um por vez.

### `lw-button`
Variantes: `primary` | `secondary` | `ghost`.
Estados: default, hover, focus, active, disabled, loading.
Só o `primary` usa `--lw-orange`, e no máximo um por tela.

### `lw-progress-bar`
Progresso de sessão de estudo. Anima com `--lw-ease` e `--lw-dur`.

### `lw-xp-badge`
Exibe XP, streak e nível. Usa `--lw-xp`, `--lw-streak`, `--lw-level`
respectivamente. Lembrar: nível é só fundo/borda.

### `lw-question-card`
Enunciado, área de resposta (textarea), rodapé com ação.
Recebe o estado de avaliação por input.

### `lw-answer-feedback` — o elemento-assinatura
Estados: `idle` | `pending` | `correct` | `partial` | `wrong`.

- `pending`: sem cor própria. Comunica por movimento contínuo, sem barra de
  progresso falsa — o tempo de resposta da IA é desconhecido, então não minta
  sobre ele.
- `partial`: o caso mais difícil e o mais comum em avaliação por IA. **Não pode
  se distinguir só por cor** — precisa de forma ou ícone próprio, senão vira
  "meio errado" na leitura do usuário.
- A transição entre estados é o momento de maior peso visual do produto inteiro.

---

## 8. Do / Don't

| Do | Don't |
|----|-------|
| `padding: var(--lw-space-lg)` | `padding: 16px` |
| `color: var(--lw-eval-correct)` | `color: #14fa4c` |
| Separar camadas com `--lw-border` | `box-shadow` de qualquer tipo |
| Um `primary` por tela | Três botões laranja competindo |
| `--lw-radius` em tudo | Pill num lugar, reto em outro |
| Pedir token novo quando faltar | Inventar um valor no meio do componente |

---

## 9. Ao terminar um componente

Sempre reporte:
1. Quais tokens foram usados
2. Se algum token necessário **não existia** — nunca invente valor, sinalize
3. Estados que ficaram sem tratamento
