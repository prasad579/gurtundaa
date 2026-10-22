import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LaundryPickupRequest,
  LaundryPickupRequestsApi,
  ProviderCustomersApi,
  ProviderDashboardApi,
  ProviderLaundryDashboard,
  ProviderLinksApi,
  ProviderManualCustomer,
  rupeeLabel,
  shareOnWhatsApp,
  shortDateLabel,
} from '@gurtundaa/shared';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, callOutline, checkmarkDoneOutline, linkOutline, locationOutline, logoWhatsapp } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AddManualCustomerComponent } from './add-manual-customer.component';

@Component({
  selector: 'app-laundry-provider',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonSkeletonText,
  ],
  templateUrl: './laundry-provider.page.html',
  styleUrl: './provider.page.scss',
})
export class LaundryProviderPage implements ViewWillEnter {
  private readonly dashboardApi = inject(ProviderDashboardApi);
  private readonly links = inject(ProviderLinksApi);
  private readonly manualCustomers = inject(ProviderCustomersApi);
  private readonly pickupRequestsApi = inject(LaundryPickupRequestsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly router = inject(Router);

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly loading = signal(true);
  protected readonly dashboard = signal<ProviderLaundryDashboard | null>(null);
  protected readonly manual = signal<ProviderManualCustomer[]>([]);
  protected readonly pickupRequests = signal<LaundryPickupRequest[]>([]);
  protected readonly linkCode = signal('');
  protected readonly linking = signal(false);

  constructor() {
    addIcons({ linkOutline, callOutline, locationOutline, add, logoWhatsapp, checkmarkDoneOutline });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected setLinkCode(value: string): void {
    this.linkCode.set(value.toUpperCase());
  }

  protected async linkCustomer(): Promise<void> {
    const code = this.linkCode().trim();
    if (!code) return;

    this.linking.set(true);
    try {
      await firstValueFrom(this.links.claim({ inviteCode: code }));
      this.linkCode.set('');
      await this.toast('customer linked ✅');
      await this.load();
    } catch (e) {
      await this.toast((e as { error?: { title?: string } })?.error?.title ?? "couldn't link that code", 'danger');
    } finally {
      this.linking.set(false);
    }
  }

  protected openCustomer(householdUserId: string): void {
    void this.router.navigateByUrl(`/provider/laundry/customers/${householdUserId}`);
  }

  protected openManualCustomer(id: string): void {
    void this.router.navigateByUrl(`/provider/laundry/manual-customers/${id}`);
  }

  protected askOnWhatsApp(name: string, phone: string | null): void {
    if (!phone) return;
    shareOnWhatsApp(phone, `Hi ${name}, do you have any laundry ready for pickup today? 🧺`);
  }

  protected async addManualCustomer(): Promise<void> {
    const modal = await this.modals.create({
      component: AddManualCustomerComponent,
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    await firstValueFrom(this.manualCustomers.create(data));
    await this.toast('customer added');
    await this.load();
  }

  protected async markPickupHandled(request: LaundryPickupRequest): Promise<void> {
    await firstValueFrom(this.pickupRequestsApi.markHandled(request.id));
    await this.toast('marked as handled');
    await this.load();
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [dashboard, manual, pickupRequests] = await Promise.all([
        firstValueFrom(this.dashboardApi.getLaundryDashboard()),
        firstValueFrom(this.manualCustomers.list()),
        firstValueFrom(this.pickupRequestsApi.listPending()),
      ]);
      this.dashboard.set(dashboard);
      this.manual.set(manual);
      this.pickupRequests.set(pickupRequests);
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
