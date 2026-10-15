import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const signedInGuard: CanActivateFn = () =>
  inject(AuthService).isSignedIn() || inject(Router).createUrlTree(['/login']);

export const signedOutGuard: CanActivateFn = () =>
  !inject(AuthService).isSignedIn() || inject(Router).createUrlTree(['/']);
