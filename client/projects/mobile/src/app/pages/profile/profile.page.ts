import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HouseholdApi } from '@gurtundaa/shared';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, ToastController, ViewWillEnter } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ACCOUNT_TYPES, AccountType, FEATURE_OPTIONS, FeatureKey } from '../../services/onboarding-state';

@Component({
  selector: 'app-profile',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements ViewWillEnter {
  private readonly household = inject(HouseholdApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  protected readonly options = ACCOUNT_TYPES;
  protected readonly featureOptions = FEATURE_OPTIONS;

  protected readonly loading = signal(true);
  protected readonly hasProfile = signal(false);
  protected readonly busy = signal(false);

  protected readonly accountType = signal<AccountType>('Family');
  protected readonly adults = signal(0);
  protected readonly children = signal(0);
  protected readonly city = signal('');
  protected readonly enabledFeatures = signal<Set<FeatureKey>>(new Set());

  ionViewWillEnter(): void {
    void this.load();
  }

  protected select(value: AccountType): void {
    this.accountType.set(value);
  }

  protected adjustAdults(delta: number): void {
    this.adults.update((n) => Math.max(0, n + delta));
  }

  protected adjustChildren(delta: number): void {
    this.children.update((n) => Math.max(0, n + delta));
  }

  protected toggleFeature(key: FeatureKey): void {
    this.enabledFeatures.update((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  protected onCityInput(value: string): void {
    this.city.set(value);
  }

  protected setUpNow(): void {
    void this.router.navigateByUrl('/onboarding');
  }

  protected async save(): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.household.save({
          accountType: this.accountType(),
          adults: this.adults(),
          children: this.children(),
          city: this.city() || null,
          enabledFeatures: [...this.enabledFeatures()],
        }),
      );
      this.hasProfile.set(true);
      await this.toast('saved ✍️');
    } catch {
      await this.toast("couldn't save, try again", 'danger');
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const profile = await firstValueFrom(this.household.get());
      this.hasProfile.set(profile !== null);
      if (profile) {
        this.accountType.set(profile.accountType as AccountType);
        this.adults.set(profile.adults);
        this.children.set(profile.children);
        this.city.set(profile.city ?? '');
        this.enabledFeatures.set(new Set(profile.enabledFeatures as FeatureKey[]));
      }
    } catch {
      await this.toast("couldn't load your household details", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
