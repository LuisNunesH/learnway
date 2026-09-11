import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { Spinner } from '../../shared/widgets';
import { AuthArt } from './auth-art';
import { SocialLogin } from './social-login';
import { ThemeToggle } from '../../shared/theme-toggle';

@Component({
  selector: 'lw-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Icon, Spinner, SocialLogin, AuthArt, ThemeToggle],
  styleUrl: './auth-shell.scss',
  template: `
    <div class="auth">
      <lw-theme-toggle class="auth__theme" />

      <aside class="auth__brand">
        <div class="auth__logo"><lw-icon name="gem" [size]="20" /> LearnWay</div>
        <h1 class="auth__headline">Sua jornada até <em>dev sênior</em> começa hoje.</h1>
        <p class="auth__tagline">Ganhe XP, mantenha a streak acesa e deixe a IA lapidar suas respostas de código.</p>
        <div class="auth__points">
          <div class="point"><span class="point__icon"><lw-icon name="zap" [size]="18" /></span> XP, níveis e ranking semanal</div>
          <div class="point"><span class="point__icon"><lw-icon name="flame" [size]="18" /></span> Streak diária para criar o hábito</div>
          <div class="point"><span class="point__icon"><lw-icon name="trophy" [size]="18" /></span> Conquistas para cada marco</div>
        </div>
        <lw-auth-art />
      </aside>

      <main class="auth__panel">
        <form class="auth__card card anim-fade-up" (ngSubmit)="submit()">
          <h2>Crie sua conta</h2>
          <p class="sub">Grátis. Só precisa de um e-mail e vontade de codar.</p>

          <div class="field">
            <label for="reg-email">E-mail</label>
            <input id="reg-email" class="input" type="email" name="email" required
                   [(ngModel)]="email" placeholder="voce@exemplo.com" autocomplete="email" />
          </div>

          <div class="field">
            <label for="reg-user">Nome de usuário</label>
            <input id="reg-user" class="input" name="username" required minlength="3"
                   [(ngModel)]="username" placeholder="dev.java" autocomplete="username" />
            @if (username && username.length < 3) { <span class="field-error">Mínimo de 3 caracteres.</span> }
          </div>

          <div class="field">
            <label for="reg-pass">Senha</label>
            <input id="reg-pass" class="input" type="password" name="password" required minlength="6"
                   [(ngModel)]="password" placeholder="mínimo 6 caracteres" autocomplete="new-password" />
            @if (password && password.length < 6) { <span class="field-error">Mínimo de 6 caracteres.</span> }
          </div>

          <button class="btn btn--primary btn--lg" style="width: 100%" type="submit"
                  [disabled]="loading() || !valid()">
            @if (loading()) { <lw-spinner /> Criando conta… } @else { Começar a aprender }
          </button>

          <lw-social-login />

          <p class="swap">Já tem conta? <a routerLink="/entrar">Entre aqui</a></p>
        </form>
      </main>
    </div>
  `,
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = '';
  username = '';
  password = '';
  readonly loading = signal(false);

  valid(): boolean {
    return this.email.includes('@') && this.username.trim().length >= 3 && this.password.length >= 6;
  }

  async submit(): Promise<void> {
    if (this.loading() || !this.valid()) return;
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.auth.register(this.email.trim(), this.username.trim(), this.password),
      );
      this.toast.success(`Conta criada, ${res.user.username}!`, 'Sua primeira lição espera por você.');
      this.router.navigateByUrl('/');
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível criar a conta.');
    } finally {
      this.loading.set(false);
    }
  }
}
