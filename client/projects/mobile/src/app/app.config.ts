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
import { environment } from '../environments/environment';
import { routes } from './app.routes';
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
  ],
};
