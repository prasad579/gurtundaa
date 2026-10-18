import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService, signedInGuard, signedOutGuard } from '@gurtundaa/shared';

export const routes: Routes = [
  {
    path: '',
    // First-time unauthenticated visitors land on the welcome/onboarding screen;
    // logout and session-expiry still bounce straight to /login (see reminders.page.ts, auth.interceptor.ts).
    canActivate: [() => inject(AuthService).isSignedIn() || inject(Router).createUrlTree(['/welcome'])],
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./pages/reminders/reminders.page').then((m) => m.RemindersPage) },
      { path: 'milk', loadComponent: () => import('./pages/milk/milk.page').then((m) => m.MilkPage) },
      { path: 'laundry', loadComponent: () => import('./pages/laundry/laundry.page').then((m) => m.LaundryPage) },
      { path: 'more', loadComponent: () => import('./pages/more/more.page').then((m) => m.MorePage) },
    ],
  },
  {
    path: 'welcome',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'login',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'otp',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/otp/otp.page').then((m) => m.OtpPage),
  },
  {
    path: 'profile',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'contacts',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/contacts/contacts.page').then((m) => m.ContactsPage),
  },
  {
    path: 'milk-pause',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/milk/milk-pause.page').then((m) => m.MilkPausePage),
  },
  {
    path: 'onboarding',
    canActivate: [signedInGuard],
    children: [
      { path: '', redirectTo: 'account-type', pathMatch: 'full' },
      {
        path: 'account-type',
        loadComponent: () =>
          import('./pages/onboarding/account-type/account-type.page').then((m) => m.AccountTypePage),
      },
      {
        path: 'household',
        loadComponent: () => import('./pages/onboarding/household/household.page').then((m) => m.HouseholdPage),
      },
      {
        path: 'features',
        loadComponent: () => import('./pages/onboarding/features/features.page').then((m) => m.FeaturesPage),
      },
      {
        path: 'location',
        loadComponent: () => import('./pages/onboarding/location/location.page').then((m) => m.LocationPage),
      },
      {
        path: 'summary',
        loadComponent: () => import('./pages/onboarding/summary/summary.page').then((m) => m.SummaryPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
