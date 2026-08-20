import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'xp' | 'achievement';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  show(kind: ToastKind, title: string, message?: string, icon?: string, durationMs = 4500): void {
    const toast: Toast = { id: ++this.seq, kind, title, message, icon };
    this.toasts.update(list => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  success(title: string, message?: string) { this.show('success', title, message, 'check'); }
  error(title: string, message?: string)   { this.show('error', title, message, 'alert'); }
  info(title: string, message?: string)    { this.show('info', title, message, 'sparkles'); }
  xp(amount: number, context?: string)     { this.show('xp', `+${amount} XP`, context, 'zap'); }

  achievement(title: string, xpBonus: number, icon?: string) {
    this.show('achievement', 'Conquista desbloqueada!', `${title} · +${xpBonus} XP`, icon ?? 'trophy', 7000);
  }

  /** Mensagem amigável a partir de um HttpErrorResponse. */
  apiError(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): void {
    const e = err as { error?: { message?: string; violations?: { message: string }[] }; status?: number };
    const violation = e?.error?.violations?.[0]?.message;
    const message = violation ?? e?.error?.message ?? (e?.status === 0 ? 'Não foi possível conectar à API. O backend está rodando?' : fallback);
    this.error('Ops!', message);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
