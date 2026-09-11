import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { Spinner } from '../../shared/widgets';
import { AuthArt } from './auth-art';
import { SocialLogin } from './social-login';
import { ThemeToggle } from '../../shared/theme-toggle';

@Component({
  selector: 'lw-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Icon, Spinner, SocialLogin, AuthArt, ThemeToggle],
  styleUrl: './auth-shell.scss',
  template: `
    <div class="auth">
      <lw-theme-toggle class="auth__theme" />

      <aside class="auth__brand">
        <div class="auth__logo"><lw-icon name="gem" [size]="20" /> LearnWay</div>
        <h1 class="auth__headline">Domine o <em>Java fullstack</em> uma lição por vez.</h1>
        <p class="auth__tagline">Trilhas gamificadas, revisão espaçada com cristais de conhecimento e feedback de IA em cada resposta.</p>
        <div class="auth__points">
          <div class="point"><span class="point__icon"><lw-icon name="map" [size]="18" /></span> 8 trilhas: de POO a Kubernetes</div>
          <div class="point"><span class="point__icon"><lw-icon name="gem" [size]="18" /></span> Revisão inteligente com algoritmo SM-2</div>
          <div class="point"><span class="point__icon"><lw-icon name="bot" [size]="18" /></span> Código e respostas avaliados por IA</div>
        </div>
        <lw-auth-art />
      </aside>

      <main class="auth__panel">
        <form class="auth__card card anim-fade-up" (ngSubmit)="submit()">
          <h2>Bem-vindo de volta</h2>
          <p class="sub">Continue sua sequência de estudos — sua streak agradece. 🔥</p>

          <div class="field">
            <label for="login-id">Usuário ou e-mail</label>
            <input id="login-id" class="input" name="usernameOrEmail" required
                   [(ngModel)]="usernameOrEmail" placeholder="dev.java" autocomplete="username" />
          </div>

          <div class="field">
            <label for="login-pass">Senha</label>
            <input id="login-pass" class="input" type="password" name="password" required
                   [(ngModel)]="password" placeholder="••••••••" autocomplete="current-password" />
          </div>

          <button class="btn btn--primary btn--lg" style="width: 100%" type="submit"
                  [disabled]="loading() || !usernameOrEmail || !password">
            @if (loading()) { <lw-spinner /> Entrando… } @else { Entrar }
          </button>

          <lw-social-login />

          <p class="swap">Primeira vez por aqui? <a routerLink="/registrar">Crie sua conta</a></p>
        </form>
      </main>
    </div>
  `,
})
export class Login implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  usernameOrEmail = '';
  password = '';
  readonly loading = signal(false);

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('error') === 'oauth') {
      this.toast.error('Login social falhou', 'Tente novamente ou entre com e-mail e senha.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  async submit(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.auth.login(this.usernameOrEmail.trim(), this.password));
      this.toast.success(`Olá, ${res.user.username}!`, 'Bons estudos 🚀');
      this.router.navigateByUrl('/');
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível entrar.');
    } finally {
      this.loading.set(false);
    }
  }
}
