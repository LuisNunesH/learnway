# LearnWay

Plataforma de estudo gamificada. O usuário responde questões abertas e recebe
avaliação por IA (Gemini).

**Stack:** Angular no frontend, Java/Spring Boot no backend.

---

## Antes de mexer em qualquer UI

Leia `docs/DESIGN.md`. É obrigatório, não opcional.

Os valores de design vivem em `src/styles/_tokens.css` e são a única fonte da
verdade. Nunca escreva hex, px ou valor literal em CSS.

`docs/redesign/extracted/` contém a extração bruta do site de referência
(Dragonfly). É matéria-prima histórica, **não é o contrato de estilo** — aquele
site é institucional e não tem componentes de app. Não gere UI a partir dele.

---

## Regras que não se negociam

- Standalone components, sem NgModule
- `ChangeDetectionStrategy.OnPush` sempre
- `input()` / `output()` como signals
- Zero valor literal em CSS: apenas `var(--lw-*)`
- Componentes base em `src/app/shared/ui/`, com prefixo `lw-`
- Se faltar um token, **avise**. Não invente valor.
- Respeitar `prefers-reduced-motion` em qualquer animação

## Escopo de trabalho

Um componente ou uma tela por vez. Não gere múltiplos componentes numa tacada.
Ao terminar, reporte quais tokens usou e o que ficou sem tratamento.
