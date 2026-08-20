import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Renderer, marked } from 'marked';
import { highlightCodeBlock } from './highlight';

/**
 * Renderiza o markdown das lições (conteúdo vem do nosso próprio banco).
 * Usar com a classe global `.md` para os estilos.
 *
 * Blocos de código saem com realce de sintaxe (ver `highlight.ts`); a linguagem
 * vai no atributo `data-lang` para o rótulo estilo IDE exibido no canto.
 */
const renderer = new Renderer();

renderer.code = ({ text, lang }) => {
  const language = (lang ?? '').trim().split(/[\s:]/)[0].toLowerCase();
  const labelAttr = language ? ` data-lang="${language}"` : '';
  return `<pre${labelAttr}><code>${highlightCodeBlock(text, language)}</code></pre>`;
};

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const html = marked.parse(value, { async: false, gfm: true, breaks: false, renderer }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
