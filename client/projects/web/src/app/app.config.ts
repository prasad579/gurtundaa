import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  AuthService,
  GURTUNDAA_API_URL,
  LocalStorageTokenStore,
  TOKEN_STORE,
  authInterceptor,
} from '@gurtundaa/shared';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: GURTUNDAA_API_URL, useValue: environment.apiUrl },
    { provide: TOKEN_STORE, useFactory: () => new LocalStorageTokenStore() },
    provideAppInitializer(() => inject(AuthService).init()),
  ],
};
