import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import {
  AuthService,
  customerGuard,
  laundryProviderGuard,
  milkProviderGuard,
  shopGuard,
  signedInGuard,
  signedOutGuard,
} from '@gurtundaa/shared';

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
      { path: 'bills', loadComponent: () => import('./pages/bills/bills.page').then((m) => m.BillsPage) },
      {
        path: 'health',
        canActivate: [customerGuard],
        loadComponent: () => import('./pages/health/health-home.page').then((m) => m.HealthHomePage),
      },
      {
        path: 'marketplace',
        canActivate: [customerGuard],
        loadComponent: () => import('./pages/marketplace/marketplace-home.page').then((m) => m.MarketplaceHomePage),
      },
      {
        path: 'shop/incoming-requests',
        canActivate: [shopGuard],
        loadComponent: () =>
          import('./pages/marketplace/shop/incoming-requests.page').then((m) => m.IncomingRequestsPage),
      },
      {
        path: 'shop/orders',
        canActivate: [shopGuard],
        loadComponent: () => import('./pages/marketplace/shop/orders.page').then((m) => m.OrdersPage),
      },
      {
        path: 'shop/price-list',
        canActivate: [shopGuard],
        loadComponent: () => import('./pages/marketplace/shop/price-list.page').then((m) => m.PriceListPage),
      },
      {
        path: 'shop/profile',
        canActivate: [shopGuard],
        loadComponent: () => import('./pages/marketplace/shop/shop-profile.page').then((m) => m.ShopProfilePage),
      },
      {
        path: 'provider/laundry',
        canActivate: [laundryProviderGuard],
        loadComponent: () => import('./pages/provider/laundry-provider.page').then((m) => m.LaundryProviderPage),
      },
      {
        path: 'provider/milk',
        canActivate: [milkProviderGuard],
        loadComponent: () => import('./pages/provider/milk-provider.page').then((m) => m.MilkProviderPage),
      },
      { path: 'more', loadComponent: () => import('./pages/more/more.page').then((m) => m.MorePage) },
    ],
  },
  {
    path: 'marketplace/category/:categoryKey',
    canActivate: [signedInGuard, customerGuard],
    loadComponent: () => import('./pages/marketplace/marketplace-browse.page').then((m) => m.MarketplaceBrowsePage),
  },
  {
    path: 'marketplace/cart',
    canActivate: [signedInGuard, customerGuard],
    loadComponent: () => import('./pages/marketplace/marketplace-cart.page').then((m) => m.MarketplaceCartPage),
  },
  {
    path: 'marketplace/requests',
    canActivate: [signedInGuard, customerGuard],
    loadComponent: () => import('./pages/marketplace/my-requests.page').then((m) => m.MyRequestsPage),
  },
  {
    path: 'marketplace/requests/:id',
    canActivate: [signedInGuard, customerGuard],
    loadComponent: () => import('./pages/marketplace/request-detail.page').then((m) => m.RequestDetailPage),
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
    path: 'new-prescription',
    canActivate: [signedInGuard, customerGuard],
    loadComponent: () => import('./pages/health/new-prescription.page').then((m) => m.NewPrescriptionPage),
  },
  {
    path: 'bills/all',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/bills/bills-all.page').then((m) => m.BillsAllPage),
  },
  {
    path: 'shop-onboarding',
    canActivate: [signedInGuard, shopGuard],
    loadComponent: () => import('./pages/shop-onboarding/shop-onboarding.page').then((m) => m.ShopOnboardingPage),
  },
  {
    path: 'provider/laundry/customers/:householdUserId',
    canActivate: [signedInGuard, laundryProviderGuard],
    loadComponent: () =>
      import('./pages/provider/laundry-provider-customer.page').then((m) => m.LaundryProviderCustomerPage),
  },
  {
    path: 'provider/milk/customers/:householdUserId',
    canActivate: [signedInGuard, milkProviderGuard],
    loadComponent: () => import('./pages/provider/milk-provider-customer.page').then((m) => m.MilkProviderCustomerPage),
  },
  {
    path: 'provider/milk/manual-customers/:customerId',
    canActivate: [signedInGuard, milkProviderGuard],
    loadComponent: () => import('./pages/provider/manual-milk-customer.page').then((m) => m.ManualMilkCustomerPage),
  },
  {
    path: 'provider/laundry/manual-customers/:customerId',
    canActivate: [signedInGuard, laundryProviderGuard],
    loadComponent: () => import('./pages/provider/manual-laundry-customer.page').then((m) => m.ManualLaundryCustomerPage),
  },
  {
    path: 'onboarding',
    canActivate: [signedInGuard, customerGuard],
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
