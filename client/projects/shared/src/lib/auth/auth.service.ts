import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, tap, throwError } from 'rxjs';
import { GURTUNDAA_API_URL } from '../api/api-config';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../api/models';
import { TOKEN_STORE } from './token-store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(TOKEN_STORE);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/auth`;

  private readonly session = signal<AuthResponse | null>(null);
  private refreshInFlight: Observable<string | null> | null = null;

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isSignedIn = computed(() => this.session() !== null);

  /** Restores a saved session. Call once at startup (both apps do it in an app initializer). */
  async init(): Promise<void> {
    this.session.set(await this.store.load());
  }

  get accessToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  login(request: LoginRequest): Promise<User> {
    return this.authenticate(this.http.post<AuthResponse>(`${this.url}/login`, request));
  }

  register(request: RegisterRequest): Promise<User> {
    return this.authenticate(this.http.post<AuthResponse>(`${this.url}/register`, request));
  }

  async logout(): Promise<void> {
    const refreshToken = this.session()?.refreshToken;
    await this.clearSession();
    if (refreshToken) {
      // Best effort: the local session is already gone even if the server is unreachable.
      await firstValueFrom(this.http.post(`${this.url}/logout`, { refreshToken })).catch(() => undefined);
    }
  }

  /**
   * Swaps the refresh token for a new access token. Concurrent callers share one request,
   * because the server rotates refresh tokens and a second call with the old one would fail.
   */
  refresh(): Observable<string | null> {
    const refreshToken = this.session()?.refreshToken;
    if (!refreshToken) {
      return of(null);
    }

    this.refreshInFlight ??= this.http.post<AuthResponse>(`${this.url}/refresh`, { refreshToken }).pipe(
      tap((response) => void this.saveSession(response)),
      map((response) => response.accessToken),
      catchError(() => {
        void this.clearSession();
        return of(null);
      }),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    return this.refreshInFlight;
  }

  private async authenticate(request: Observable<AuthResponse>): Promise<User> {
    const response = await firstValueFrom(request.pipe(catchError((e) => throwError(() => toFriendlyError(e)))));
    await this.saveSession(response);
    return response.user;
  }

  private async saveSession(response: AuthResponse): Promise<void> {
    this.session.set(response);
    await this.store.save(response);
  }

  private async clearSession(): Promise<void> {
    this.session.set(null);
    await this.store.clear();
  }
}

function toFriendlyError(error: unknown): Error {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new Error("can't reach the server rn. is the api running?");
    }
    const title = error.error?.title as string | undefined;
    const validation = error.error?.errors as Record<string, string[]> | undefined;
    if (validation) {
      return new Error(Object.values(validation).flat().join(' '));
    }
    if (title) {
      return new Error(title);
    }
  }
  return new Error('something went wrong, try again?');
}
