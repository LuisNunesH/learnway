import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OAUTH_GITHUB_URL, OAUTH_GOOGLE_URL } from '../../core/api.config';

/** Divisor "ou" + botões de login social (Google / GitHub). */
@Component({
  selector: 'lw-social-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="divider"><span>ou continue com</span></div>

    <div class="social">
      <a class="social__btn" [href]="googleUrl" rel="nofollow">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.45 1.79 14.97.75 12 .75 7.6.75 3.8 3.27 1.96 6.96l3.64 2.82C6.47 7.1 9 5.04 12 5.04z"/>
          <path fill="#4285F4" d="M23.25 12.27c0-.93-.08-1.6-.26-2.3H12v4.35h6.44c-.13 1.08-.83 2.7-2.39 3.79l3.55 2.75c2.13-1.96 3.65-4.86 3.65-8.59z"/>
          <path fill="#FBBC05" d="M5.61 14.22a6.9 6.9 0 0 1-.38-2.22c0-.77.14-1.52.36-2.22L1.96 6.96A11.2 11.2 0 0 0 .75 12c0 1.81.44 3.52 1.21 5.04l3.65-2.82z"/>
          <path fill="#34A853" d="M12 23.25c3.04 0 5.59-1 7.45-2.72l-3.55-2.75c-.95.66-2.23 1.12-3.9 1.12-3 0-5.53-2.06-6.4-4.68l-3.64 2.82c1.84 3.69 5.64 6.21 10.04 6.21z"/>
        </svg>
        Google
      </a>
      <a class="social__btn" [href]="githubUrl" rel="nofollow">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55l-.01-2.15c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.25.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18a11 11 0 0 1 5.76 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.09 0 4.42-2.7 5.39-5.26 5.68.41.35.77 1.05.77 2.12l-.01 3.14c0 .3.2.66.8.55A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/>
        </svg>
        GitHub
      </a>
    </div>
  `,
  styles: [`
    .divider {
      display: flex; align-items: center; gap: var(--lw-space-md);
      margin: var(--lw-space-xl) 0 var(--lw-space-lg);
      font-family: var(--lw-font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: var(--lw-tracking-micro);
      color: var(--lw-ink-faint);
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--lw-rule); }
    }
    .social { display: grid; grid-template-columns: 1fr 1fr; gap: var(--lw-space-sm); }
    .social__btn {
      display: flex; align-items: center; justify-content: center; gap: 9px;
      padding: 11px 12px;
      border-radius: var(--lw-radius-sm);
      border: 1px solid var(--lw-rule-strong);
      background: var(--lw-paper-raised);
      color: var(--lw-ink);
      font-size: 14px; font-weight: 500;
      transition: border-color var(--lw-dur-fast) var(--lw-ease),
                  background var(--lw-dur-fast) var(--lw-ease),
                  transform var(--lw-dur-fast) var(--lw-ease);
      &:hover { border-color: var(--lw-ink-faint); background: var(--lw-paper-sunken); }
      &:active { transform: translateY(1px); }
    }
  `],
})
export class SocialLogin {
  readonly googleUrl = OAUTH_GOOGLE_URL;
  readonly githubUrl = OAUTH_GITHUB_URL;
}
