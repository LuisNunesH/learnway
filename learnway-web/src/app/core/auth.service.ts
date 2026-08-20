import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { API_URL } from './api.config';
import { AuthResponse, Profile, User } from './models';

const ACCESS_KEY = 'lw_access_token';
const REFRESH_KEY = 'lw_refresh_token';
const USER_KEY = 'lw_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private readonly _user = signal<User | null>(readUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null && !!this.accessToken);

  get accessToken(): string | null { return localStorage.getItem(ACCESS_KEY); }
  get refreshTokenValue(): string | null { return localStorage.getItem(REFRESH_KEY); }

  register(email: string, username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, { email, username, password })
      .pipe(tap(res => this.store(res)));
  }

  login(usernameOrEmail: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { usernameOrEmail, password })
      .pipe(tap(res => this.store(res)));
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken: this.refreshTokenValue })
      .pipe(tap(res => this.store(res)));
  }

  /**
   * Fecha o login social: adota os JWTs recebidos no redirect do backend
   * e busca o perfil para preencher o usuário local.
   */
  async adoptTokens(accessToken: string, refreshToken: string): Promise<User> {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    const profile = await firstValueFrom(this.http.get<Profile>(`${API_URL}/users/profile/me`));
    this.setUser(profile.user);
    return profile.user;
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  /** Atualiza o usuário local (após ganhar XP, streak etc.). */
  setUser(user: User): void {
    this._user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private store(res: AuthResponse): void {
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this.setUser(res.user);
  }
}

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
