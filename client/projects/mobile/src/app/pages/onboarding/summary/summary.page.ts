import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HouseholdApi } from '@gurtundaa/shared';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { OnboardingState } from '../../../services/onboarding-state';
import { OnboardingShell } from '../onboarding-shell';

@Component({
  selector: 'app-onboarding-summary',
  imports: [OnboardingShell, TranslatePipe],
  templateUrl: './summary.page.html',
  styleUrl: './summary.page.scss',
})
export class SummaryPage {
  private readonly router = inject(Router);
  private readonly household = inject(HouseholdApi);
  private readonly translate = inject(TranslateService);
  protected readonly state = inject(OnboardingState);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  // A translation key, not display text — the template pipes it through `| translate`.
  protected readonly accountTypeLabel = computed(() => `onboarding.accountTypes.${this.state.accountType()}.label`);
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
      this.error.set(this.translate.instant('onboarding.summary.saveError'));
    } finally {
      this.busy.set(false);
    }
  }

  protected skip(): void {
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
