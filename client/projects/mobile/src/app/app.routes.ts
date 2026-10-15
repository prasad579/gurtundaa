import { Routes } from '@angular/router';
import { signedInGuard, signedOutGuard } from '@gurtundaa/shared';

export const routes: Routes = [
  {
    path: '',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/reminders/reminders.page').then((m) => m.RemindersPage),
  },
  {
    path: 'login',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  { path: '**', redirectTo: '' },
];
