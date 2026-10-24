import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ACCOUNT_TYPES, AccountType, OnboardingState } from '../../../services/onboarding-state';
import { OnboardingShell } from '../onboarding-shell';

@Component({
  selector: 'app-onboarding-account-type',
  imports: [OnboardingShell, TranslatePipe],
  templateUrl: './account-type.page.html',
  styleUrl: './account-type.page.scss',
})
export class AccountTypePage {
  private readonly router = inject(Router);
  protected readonly state = inject(OnboardingState);

  protected readonly options = ACCOUNT_TYPES;

  protected select(value: AccountType): void {
    this.state.accountType.set(value);
  }

  protected continue(): void {
    void this.router.navigateByUrl('/onboarding/household');
  }

  protected skip(): void {
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
