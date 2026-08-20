import { DestroyRef, Directive, ElementRef, HostListener, OnInit, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';

/** Teto de crescimento do campo (~6 linhas); daí em diante ele rola. */
const MAX_HEIGHT = 168;

/**
 * Campo de conversa dos painéis de IA: Enter envia, Shift+Enter quebra a linha
 * — a mesma convenção dos chats que o aluno já usa. A altura acompanha o texto
 * digitado para que a mensagem inteira fique à vista antes do envio.
 */
@Directive({ selector: 'textarea[lwChatInput]' })
export class ChatInput implements OnInit {
  /** Enter sem Shift: o componente decide se a mensagem pode partir. */
  readonly enterSubmit = output<void>();

  private readonly el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;
  private readonly control = inject(NgControl, { optional: true, self: true });
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.grow();
    // O texto também muda de fora — limpo ao enviar, devolvido ao cancelar —,
    // e nesses casos não há evento de input para reajustar a altura.
    this.control?.valueChanges
      ?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => queueMicrotask(() => this.grow()));
  }

  @HostListener('keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Enter' || ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    // Com o IME aberto, Enter confirma a palavra sendo composta — não envia.
    if (ev.isComposing || ev.keyCode === 229) return;
    ev.preventDefault();
    this.enterSubmit.emit();
  }

  @HostListener('input')
  grow(): void {
    this.el.style.height = 'auto';
    this.el.style.height = `${Math.min(this.el.scrollHeight, MAX_HEIGHT)}px`;
  }
}
