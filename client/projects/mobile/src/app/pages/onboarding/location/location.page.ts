import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { OnboardingState } from '../../../services/onboarding-state';
import { OnboardingShell } from '../onboarding-shell';

@Component({
  selector: 'app-onboarding-location',
  imports: [OnboardingShell, TranslatePipe],
  templateUrl: './location.page.html',
  styleUrl: './location.page.scss',
})
export class LocationPage {
  private readonly router = inject(Router);
  protected readonly state = inject(OnboardingState);

  protected onCityInput(value: string): void {
    this.state.city.set(value);
  }

  protected back(): void {
    void this.router.navigateByUrl('/onboarding/features');
  }

  protected continue(): void {
    void this.router.navigateByUrl('/onboarding/summary');
  }

  protected skip(): void {
    void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
