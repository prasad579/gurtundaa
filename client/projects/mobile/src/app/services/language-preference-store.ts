import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const KEY = 'gurtundaa.language';

/** Persists the chosen UI language in native app storage; falls back to localStorage on web. */
@Injectable({ providedIn: 'root' })
export class LanguagePreferenceStore {
  async load(): Promise<string | null> {
    const { value } = await Preferences.get({ key: KEY });
    return value;
  }

  async save(lang: string): Promise<void> {
    await Preferences.set({ key: KEY, value: lang });
  }
}
