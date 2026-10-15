import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { AuthResponse, TokenStore } from '@gurtundaa/shared';

const KEY = 'gurtundaa.session';

/** Keeps the session in native app storage (SharedPreferences / UserDefaults); falls back to localStorage on web. */
@Injectable()
export class PreferencesTokenStore implements TokenStore {
  async load(): Promise<AuthResponse | null> {
    const { value } = await Preferences.get({ key: KEY });
    try {
      return value ? (JSON.parse(value) as AuthResponse) : null;
    } catch {
      return null;
    }
  }

  async save(session: AuthResponse): Promise<void> {
    await Preferences.set({ key: KEY, value: JSON.stringify(session) });
  }

  async clear(): Promise<void> {
    await Preferences.remove({ key: KEY });
  }
}
