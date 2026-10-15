import { Routes } from '@angular/router';
import { signedInGuard, signedOutGuard } from '@gurtundaa/shared';

export const routes: Routes = [
  {
    path: '',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  { path: '**', redirectTo: '' },
];
