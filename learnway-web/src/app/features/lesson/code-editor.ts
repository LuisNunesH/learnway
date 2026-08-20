import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender,
  inject, input, model, viewChild,
} from '@angular/core';
import { EditorView, basicSetup } from 'codemirror';
import { java } from '@codemirror/lang-java';

/** Wrapper fino do CodeMirror 6 com o tema claro do sistema "Papel". */
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
    const highlight = EditorView.theme(
      {
        // Realce claro do sistema "Papel", validado AA sobre o rebaixo #f5f2ea.
        // Mesmas cores do realce dos blocos de markdown (styles.scss > .md pre code),
        // que lá vêm dos tokens --lw-code-*; aqui precisam ser literais porque o
        // CodeMirror monta a folha de estilo em JS.
        '&': { color: '#191714' },
        '.cm-line': { padding: '0 12px' },
        '.cm-keyword, .tok-keyword': { color: '#8e3620', fontWeight: '600' },
        '.tok-modifier': { color: '#8e3620' },
        '.tok-string': { color: '#2f6b45' },
        '.tok-comment': { color: '#6e6959', fontStyle: 'italic' },
        '.tok-number': { color: '#7a4e8c' },
        '.tok-bool, .tok-null': { color: '#8e3620', fontWeight: '600' },
        '.tok-typeName, .tok-className': { color: '#1f5c7a' },
        '.tok-annotation, .tok-meta': { color: '#8a5a0b' },
        '.tok-variableName': { color: '#191714' },
        '.tok-variableName.tok-definition': { color: '#191714', fontWeight: '600' },
        '.tok-propertyName': { color: '#1f5c7a' },
        '.tok-operator': { color: '#655f53' },
        '.tok-punctuation': { color: '#655f53' },
      },
      { dark: false },
    );

    this.view = new EditorView({
      parent: this.hostRef().nativeElement,
      doc: this.code(),
      extensions: [
        basicSetup,
        java(),
        highlight,
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
