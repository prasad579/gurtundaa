import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService, HouseholdApi, MilkApi } from '@gurtundaa/shared';
import { IonBadge, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  downloadOutline,
  ellipsisHorizontalOutline,
  homeOutline,
  medkitOutline,
  peopleOutline,
  receiptOutline,
  shirtOutline,
  storefrontOutline,
  waterOutline,
} from 'ionicons/icons';
import { filter, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  templateUrl: './tabs.page.html',
})
export class TabsPage {
  private readonly household = inject(HouseholdApi);
  private readonly auth = inject(AuthService);
  private readonly milk = inject(MilkApi);

  protected readonly isShop = computed(() => this.auth.user()?.userType === 'Shop');
  protected readonly isMilkProvider = computed(() => this.auth.user()?.userType === 'MilkProvider');
  protected readonly isLaundryProvider = computed(() => this.auth.user()?.userType === 'LaundryProvider');
  protected readonly enabledFeatures = signal<ReadonlySet<string>>(new Set());
  protected readonly unseenMilkActivity = signal(0);

  constructor() {
    addIcons({
      homeOutline,
      waterOutline,
      shirtOutline,
      receiptOutline,
      ellipsisHorizontalOutline,
      cartOutline,
      downloadOutline,
      storefrontOutline,
      medkitOutline,
      peopleOutline,
    });
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
    // Shop/provider accounts have no HouseholdProfile row at all — calling household.get() for
    // them would just be a guaranteed 404 on every navigation.
    if (this.isShop() || this.isMilkProvider() || this.isLaundryProvider()) {
      this.enabledFeatures.set(new Set());
      return;
    }

    try {
      const profile = await firstValueFrom(this.household.get());
      const features = new Set(profile?.enabledFeatures ?? []);
      this.enabledFeatures.set(features);

      if (features.has('milk')) {
        this.unseenMilkActivity.set(await firstValueFrom(this.milk.getUnseenProviderActivityCount()));
      }
    } catch {
      // Household profile not loadable (e.g. onboarding not finished yet) — keep optional tabs hidden.
      this.enabledFeatures.set(new Set());
    }
  }
}
