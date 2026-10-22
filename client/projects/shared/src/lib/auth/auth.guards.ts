import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const signedInGuard: CanActivateFn = () =>
  inject(AuthService).isSignedIn() || inject(Router).createUrlTree(['/login']);

export const signedOutGuard: CanActivateFn = () =>
  !inject(AuthService).isSignedIn() || inject(Router).createUrlTree(['/']);

export const customerGuard: CanActivateFn = () =>
  (inject(AuthService).user()?.userType ?? 'Customer') === 'Customer' || inject(Router).createUrlTree(['/']);

export const shopGuard: CanActivateFn = () =>
  inject(AuthService).user()?.userType === 'Shop' || inject(Router).createUrlTree(['/']);

export const milkProviderGuard: CanActivateFn = () =>
  inject(AuthService).user()?.userType === 'MilkProvider' || inject(Router).createUrlTree(['/']);

export const laundryProviderGuard: CanActivateFn = () =>
  inject(AuthService).user()?.userType === 'LaundryProvider' || inject(Router).createUrlTree(['/']);
