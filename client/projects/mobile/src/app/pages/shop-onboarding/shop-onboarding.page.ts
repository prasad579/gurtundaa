import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BRAND, ShopProfileApi } from '@gurtundaa/shared';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonText } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-shop-onboarding',
  imports: [ReactiveFormsModule, IonContent, IonList, IonItem, IonInput, IonButton, IonText],
  templateUrl: './shop-onboarding.page.html',
  styleUrl: './shop-onboarding.page.scss',
})
export class ShopOnboardingPage {
  private readonly shopProfile = inject(ShopProfileApi);
  private readonly router = inject(Router);

  protected readonly brand = BRAND;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    shopName: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });

  protected async submit(): Promise<void> {
    const { shopName, city, address } = this.form.getRawValue();
    if (!shopName.trim()) {
      this.error.set('shop name is required');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.shopProfile.save({
          shopName: shopName.trim(),
          city: city.trim() || null,
          address: address.trim() || null,
          servedCategoryKeys: [],
        }),
      );
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
