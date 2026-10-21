import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MARKETPLACE_CATALOG, ShopProfileApi } from '@gurtundaa/shared';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-shop-profile',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonIcon],
  templateUrl: './shop-profile.page.html',
  styleUrl: './shop-profile.page.scss',
})
export class ShopProfilePage implements ViewWillEnter {
  private readonly shopProfile = inject(ShopProfileApi);
  private readonly toasts = inject(ToastController);

  protected readonly categories = MARKETPLACE_CATALOG;
  protected readonly busy = signal(false);
  protected readonly selectedCategoryKeys = signal<ReadonlySet<string>>(new Set());

  constructor() {
    addIcons({ checkmark });
  }

  protected readonly form = new FormGroup({
    shopName: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });

  protected readonly categoryCountLabel = computed(() => `${this.selectedCategoryKeys().size} of ${this.categories.length} categories selected`);

  ionViewWillEnter(): void {
    void this.load();
  }

  protected toggleCategory(key: string): void {
    this.selectedCategoryKeys.update((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  protected async save(): Promise<void> {
    const { shopName, city, address } = this.form.getRawValue();
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.shopProfile.save({
          shopName: shopName.trim(),
          city: city.trim() || null,
          address: address.trim() || null,
          servedCategoryKeys: [...this.selectedCategoryKeys()],
        }),
      );
      await this.toast('profile saved ✅');
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    const profile = await firstValueFrom(this.shopProfile.get());
    if (profile) {
      this.form.setValue({ shopName: profile.shopName, city: profile.city ?? '', address: profile.address ?? '' });
      this.selectedCategoryKeys.set(new Set(profile.servedCategoryKeys));
    }
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom' });
    await toast.present();
  }
}
