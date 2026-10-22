import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LaundryBatch, ProviderDashboardApi, ProviderLaundryCustomerDetail, rupeeLabel, shortDateLabel } from '@gurtundaa/shared';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-laundry-provider-customer',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonSkeletonText],
  templateUrl: './laundry-provider-customer.page.html',
  styleUrl: './provider.page.scss',
})
export class LaundryProviderCustomerPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardApi = inject(ProviderDashboardApi);
  private readonly toasts = inject(ToastController);

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly loading = signal(true);
  protected readonly detail = signal<ProviderLaundryCustomerDetail | null>(null);

  ionViewWillEnter(): void {
    void this.load();
  }

  protected totalQty(batch: LaundryBatch): number {
    return batch.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  protected itemsBreakdown(batch: LaundryBatch): string {
    return batch.items.map((i) => `${i.itemType} ×${i.quantity}`).join(', ');
  }

  private async load(): Promise<void> {
    const householdUserId = this.route.snapshot.paramMap.get('householdUserId');
    if (!householdUserId) return;

    this.loading.set(true);
    try {
      this.detail.set(await firstValueFrom(this.dashboardApi.getLaundryCustomer(householdUserId)));
    } catch {
      const toast = await this.toasts.create({ message: "can't reach the server rn 😵‍💫", duration: 1800, color: 'danger' });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }
}
