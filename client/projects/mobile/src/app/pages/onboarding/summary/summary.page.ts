import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HouseholdApi } from '@gurtundaa/shared';
import { firstValueFrom } from 'rxjs';
import { ACCOUNT_TYPES, OnboardingState } from '../../../services/onboarding-state';
import { OnboardingShell } from '../onboarding-shell';

@Component({
  selector: 'app-onboarding-summary',
  imports: [OnboardingShell],
  templateUrl: './summary.page.html',
  styleUrl: './summary.page.scss',
})
export class SummaryPage {
  private readonly router = inject(Router);
  private readonly household = inject(HouseholdApi);
  protected readonly state = inject(OnboardingState);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly accountTypeLabel = computed(
    () => ACCOUNT_TYPES.find((o) => o.value === this.state.accountType())?.label ?? this.state.accountType(),
  );
  protected readonly featureCount = computed(() => this.state.enabledFeatures().size);

  protected back(): void {
    void this.router.navigateByUrl('/onboarding/location');
  }

  protected async finish(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.household.save({
          accountType: this.state.accountType(),
          adults: this.state.adults(),
          children: this.state.children(),
          city: this.state.city() || null,
          enabledFeatures: [...this.state.enabledFeatures()],
        }),
      );
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch {
      this.error.set("couldn't save your setup, but you can still continue and edit it later");
    } finally {
      this.busy.set(false);
    }
  }

  protected skip(): void {
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
