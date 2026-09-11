import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender,
  inject, input, model, viewChild,
} from '@angular/core';
import { EditorView, basicSetup } from 'codemirror';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { java } from '@codemirror/lang-java';
import { tags as t } from '@lezer/highlight';

/**
 * Realce de sintaxe do sistema, nas mesmas tintas dos blocos de markdown
 * (styles.scss > .md pre code): os dois leem os tokens --lw-code-*.
 *
 * Isto SUBSTITUI o `defaultHighlightStyle` que vem no `basicSetup` — ele é
 * registrado como `fallback`, e o CodeMirror só usa o fallback quando não há
 * nenhum outro realce ativo. Sem isto, tipo e identificador saíam no azul-marinho
 * padrão da biblioteca (#219), que no papel claro passava despercebido mas no
 * nanquim ficava ilegível — quase a mesma luminância do fundo.
 *
 * As cores são var(): o CodeMirror monta esta folha em JS, mas o que sai é CSS
 * de verdade, então o editor acompanha a troca de tema sem ser remontado.
 */
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword],
    color: 'var(--lw-code-kw)', fontWeight: '600' },
  { tag: [t.bool, t.null, t.atom, t.self, t.literal], color: 'var(--lw-code-kw)', fontWeight: '600' },

  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: 'var(--lw-code-type)' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--lw-code-type)' },

  { tag: [t.definition(t.variableName), t.definition(t.propertyName), t.function(t.variableName), t.function(t.propertyName)],
    color: 'var(--lw-code-ink)', fontWeight: '600' },
  { tag: [t.variableName, t.labelName, t.name], color: 'var(--lw-code-ink)' },

  { tag: [t.string, t.character, t.special(t.string), t.escape], color: 'var(--lw-code-str)' },
  { tag: [t.number, t.integer, t.float], color: 'var(--lw-code-num)' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
    color: 'var(--lw-code-cmt)', fontStyle: 'italic' },
  { tag: [t.annotation, t.meta, t.documentMeta], color: 'var(--lw-code-ann)' },

  { tag: [t.operator, t.derefOperator, t.arithmeticOperator, t.logicOperator, t.compareOperator,
          t.updateOperator, t.typeOperator, t.punctuation, t.separator, t.bracket],
    color: 'var(--lw-code-punct)' },

  { tag: t.invalid, color: 'var(--lw-eval-wrong)' },
]);

/** Wrapper fino do CodeMirror 6 vestido com os tokens de cor do sistema. */
@Component({
  selector: 'lw-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="host"></div>`,
  styles: [`
    .host { width: 100%; }
    :host ::ng-deep .cm-editor { min-height: 220px; max-height: 460px; }
    :host ::ng-deep .cm-scroller { overflow: auto; font-family: var(--lw-font-mono); }
  `],
})
export class CodeEditor implements OnDestroy {
  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private view: EditorView | null = null;

  readonly code = model('');
  readonly readonly = input(false);

  constructor() {
    afterNextRender(() => this.init());
  }

  private init(): void {
    // Só o que é ESTRUTURA fica aqui; cor de token vive no HighlightStyle acima
    // e superfície/seleção/linha ativa vivem em styles.scss (.cm-editor).
    const layout = EditorView.theme(
      {
        '&': { color: 'var(--lw-code-ink)' },
        '.cm-line': { padding: '0 12px' },
      },
      // `dark` só escolhe o pacote de estilos padrão do CodeMirror; como
      // superfície, seleção e realce vêm todos do sistema, o valor não muda
      // nada visível e fica fixo em vez de virar mais um estado.
      { dark: false },
    );

    this.view = new EditorView({
      parent: this.hostRef().nativeElement,
      doc: this.code(),
      extensions: [
        basicSetup,
        java(),
        layout,
        syntaxHighlighting(highlight),
        EditorView.editable.of(!this.readonly()),
        EditorView.updateListener.of(update => {
          if (update.docChanged) this.code.set(update.state.doc.toString());
        }),
      ],
    });
  }

  /** Substitui o conteúdo (ex.: reset para o código inicial). */
  setValue(value: string): void {
    if (!this.view) return;
    this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: value } });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }
}
