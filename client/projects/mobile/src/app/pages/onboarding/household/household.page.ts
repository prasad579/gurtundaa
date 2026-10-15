import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingState } from '../../../services/onboarding-state';
import { OnboardingShell } from '../onboarding-shell';

@Component({
  selector: 'app-onboarding-household',
  imports: [OnboardingShell],
  templateUrl: './household.page.html',
  styleUrl: './household.page.scss',
})
export class HouseholdPage {
  private readonly router = inject(Router);
  protected readonly state = inject(OnboardingState);

  protected adjustAdults(delta: number): void {
    this.state.adults.update((n) => Math.max(0, n + delta));
  }

  protected adjustChildren(delta: number): void {
    this.state.children.update((n) => Math.max(0, n + delta));
  }

  protected back(): void {
    void this.router.navigateByUrl('/onboarding/account-type');
  }

  protected continue(): void {
    void this.router.navigateByUrl('/onboarding/features');
  }

  protected skip(): void {
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
