import { Injectable, signal } from '@angular/core';

export const MAX_AI_INTERACTIONS = 5;

export interface ChatMessage { role: 'user' | 'ai'; text: string; }

/**
 * Estado do chat "Aprofundar com IA" que sobrevive ao fechar/reabrir o painel.
 * A sessão dura enquanto a lição está aberta: é encerrada quando a lição é
 * concluída ou quando o usuário sai da página (LessonPlayer.ngOnDestroy).
 */
@Injectable({ providedIn: 'root' })
export class AiChatSessionService {
  readonly messages = signal<ChatMessage[]>([]);
  readonly used = signal(0);

  private lessonId: string | null = null;

  /** Vincula o estado à lição atual; trocar de lição descarta a conversa anterior. */
  bind(lessonId: string): void {
    if (this.lessonId === lessonId) return;
    this.lessonId = lessonId;
    this.messages.set([]);
    this.used.set(0);
  }

  /** Limpa só as mensagens — as perguntas já usadas continuam contando. */
  clearMessages(): void {
    this.messages.set([]);
  }

  /** Fim da sessão de estudo: apaga a conversa e zera o contador. */
  end(): void {
    this.lessonId = null;
    this.messages.set([]);
    this.used.set(0);
  }
}
