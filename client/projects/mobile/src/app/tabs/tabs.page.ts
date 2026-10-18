import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { HouseholdApi } from '@gurtundaa/shared';
import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisHorizontalOutline, homeOutline, shirtOutline, waterOutline } from 'ionicons/icons';
import { filter, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html',
})
export class TabsPage {
  private readonly household = inject(HouseholdApi);

  protected readonly enabledFeatures = signal<ReadonlySet<string>>(new Set());

  constructor() {
    addIcons({ homeOutline, waterOutline, shirtOutline, ellipsisHorizontalOutline });
    void this.loadFeatures();

    // The tabs shell stays mounted across navigation (e.g. to/from the Profile page), so a
    // one-time constructor fetch would never notice features enabled after the fact. Re-check
    // on every navigation instead — cheap GET, and it's the only reliable "we're back" signal
    // since this component isn't itself a routed page with its own view-enter lifecycle.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => void this.loadFeatures());
  }

  private async loadFeatures(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.household.get());
      this.enabledFeatures.set(new Set(profile?.enabledFeatures ?? []));
    } catch {
      // Household profile not loadable (e.g. onboarding not finished yet) — keep optional tabs hidden.
      this.enabledFeatures.set(new Set());
    }
  }
}
