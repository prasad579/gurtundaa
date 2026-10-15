import { InjectionToken } from '@angular/core';
import { AuthResponse } from '../api/models';

/**
 * Where the session lives. Async so the mobile app can back it with Capacitor Preferences
 * (native storage) while the web app uses localStorage.
 */
export interface TokenStore {
  load(): Promise<AuthResponse | null>;
  save(session: AuthResponse): Promise<void>;
  clear(): Promise<void>;
}

export const TOKEN_STORE = new InjectionToken<TokenStore>('TOKEN_STORE');

const STORAGE_KEY = 'gurtundaa.session';

export class LocalStorageTokenStore implements TokenStore {
  async load(): Promise<AuthResponse | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }

  async save(session: AuthResponse): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}
