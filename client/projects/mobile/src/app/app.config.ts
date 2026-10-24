import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { AuthService, GURTUNDAA_API_URL, TOKEN_STORE, authInterceptor } from '@gurtundaa/shared';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { LanguagePreferenceStore } from './services/language-preference-store';
import { PreferencesTokenStore } from './services/preferences-token-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Ionic still relies on zone.js, so the mobile app opts back into zone-based change detection.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: GURTUNDAA_API_URL, useValue: environment.apiUrl },
    { provide: TOKEN_STORE, useClass: PreferencesTokenStore },
    provideAppInitializer(() => inject(AuthService).init()),
    // provideTranslateService() registers its own default (no-op) TranslateLoader when no
    // `loader` is passed in its config — since Angular resolves duplicate same-token providers
    // to whichever one appears LAST in the array, the HTTP loader below must come after this
    // call, or it gets silently shadowed and every translation falls back to its raw key.
    ...provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
    ...provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    // Waits for the language file to actually load (not just subscribes) so the first render
    // already has the right language instead of a flash of English. Both inject() calls must
    // happen synchronously, before the first `await` — the injection context doesn't survive
    // into the resumed async continuation (NG0203 otherwise).
    provideAppInitializer(() => {
      const languageStore = inject(LanguagePreferenceStore);
      const translate = inject(TranslateService);
      return (async () => {
        const lang = await languageStore.load();
        await firstValueFrom(translate.use(lang ?? 'en'));
      })();
    }),
  ],
};
