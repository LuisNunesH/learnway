import { Injectable, signal } from '@angular/core';
import { AiChatTurn, StatementVerdict } from '../../core/models';

export interface ValidatorMessage extends AiChatTurn {
  /** presente apenas nas respostas da IA */
  verdict?: StatementVerdict;
}

/**
 * Estado dos dois chats da página de teoria — "Validar conhecimento" e
 * "Tirar dúvidas". Cada painel guarda aqui o próprio histórico, para que
 * fechar e reabrir não apague a conversa; trocar de assunto descarta as duas,
 * e sair da página encerra tudo (TheoryPage.ngOnDestroy chama end()).
 */
@Injectable({ providedIn: 'root' })
export class TheoryChatSessionService {
  readonly validatorMessages = signal<ValidatorMessage[]>([]);
  readonly askMessages = signal<AiChatTurn[]>([]);

  private articleId: string | null = null;

  /** Vincula o estado ao artigo atual; trocar de artigo descarta as conversas anteriores. */
  bind(articleId: string): void {
    if (this.articleId === articleId) return;
    this.articleId = articleId;
    this.validatorMessages.set([]);
    this.askMessages.set([]);
  }

  clearValidator(): void {
    this.validatorMessages.set([]);
  }

  clearAsk(): void {
    this.askMessages.set([]);
  }

  /** Saiu da página de teoria: apaga as conversas. */
  end(): void {
    this.articleId = null;
    this.validatorMessages.set([]);
    this.askMessages.set([]);
  }
}
