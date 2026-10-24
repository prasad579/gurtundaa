import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FEATURE_OPTIONS, FeatureKey, OnboardingState } from '../../../services/onboarding-state';
import { OnboardingShell } from '../onboarding-shell';

@Component({
  selector: 'app-onboarding-features',
  imports: [OnboardingShell, TranslatePipe],
  templateUrl: './features.page.html',
  styleUrl: './features.page.scss',
})
export class FeaturesPage {
  private readonly router = inject(Router);
  protected readonly state = inject(OnboardingState);

  protected readonly options = FEATURE_OPTIONS;

  protected toggle(key: FeatureKey): void {
    this.state.toggleFeature(key);
  }

  protected back(): void {
    void this.router.navigateByUrl('/onboarding/household');
  }

  protected continue(): void {
    void this.router.navigateByUrl('/onboarding/location');
  }

  protected skip(): void {
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
