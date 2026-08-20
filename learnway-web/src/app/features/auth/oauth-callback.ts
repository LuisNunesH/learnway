import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { Spinner } from '../../shared/widgets';

/**
 * Destino do redirect do login social. O backend envia os JWTs no fragment
 * (#access_token=…&refresh_token=…), que nunca chega ao servidor — só o
 * navegador consegue lê-lo aqui.
 */
@Component({
  selector: 'lw-oauth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Spinner],
  template: `
    <div class="wrap">
      <div class="card box anim-pop">
        <lw-icon name="gem" [size]="34" />
        <h2>Entrando…</h2>
        <p class="muted">Finalizando seu login social.</p>
        <lw-spinner [size]="22" />
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .box {
      display: flex; flex-direction: column; align-items: center; gap: var(--lw-space-md);
      padding: var(--lw-space-2xl) var(--lw-space-3xl);
      box-shadow: var(--lw-lift);
      lw-icon { color: var(--lw-accent); }
      h2 { font-size: var(--lw-text-h2); }
      p { font-family: var(--lw-font-prose); }
      lw-spinner { color: var(--lw-ink-faint); }
    }
  `],
})
export class OAuthCallback implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');

    // limpa os tokens da barra de endereço/histórico
    history.replaceState(null, '', '/oauth/callback');

    if (!access || !refresh) {
      this.toast.error('Login social falhou', 'Tente novamente ou entre com e-mail e senha.');
      this.router.navigateByUrl('/entrar');
      return;
    }

    try {
      const user = await this.auth.adoptTokens(access, refresh);
      this.toast.success(`Olá, ${user.username}!`, 'Login social concluído 🚀');
      this.router.navigateByUrl('/');
    } catch {
      this.auth.logout();
      this.toast.error('Login social falhou', 'Não foi possível carregar seu perfil.');
      this.router.navigateByUrl('/entrar');
    }
  }
}
