import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MilkMonth, MilkSlot, ProviderDashboardApi, ProviderMilkCustomerDetail, rupeeLabel, toDateOnlyString } from '@gurtundaa/shared';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { MilkCalendarComponent } from '../milk/milk-calendar.component';

@Component({
  selector: 'app-milk-provider-customer',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonIcon,
    IonSkeletonText,
    MilkCalendarComponent,
  ],
  templateUrl: './milk-provider-customer.page.html',
  styleUrl: './provider.page.scss',
})
export class MilkProviderCustomerPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardApi = inject(ProviderDashboardApi);
  private readonly toasts = inject(ToastController);
  private readonly alerts = inject(AlertController);
  private readonly householdUserId = this.route.snapshot.paramMap.get('householdUserId') ?? '';

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly loading = signal(true);
  protected readonly detail = signal<ProviderMilkCustomerDetail | null>(null);
  protected readonly month = signal<MilkMonth | null>(null);

  private readonly monthDate = signal(new Date());
  protected readonly monthLabel = computed(() =>
    this.monthDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );
  protected readonly baseQuantityLtr = computed(() => {
    const s = this.detail()?.subscription;
    if (!s) return 0;
    return (s.morningEnabled ? s.morningQuantityLtr : 0) + (s.eveningEnabled ? s.eveningQuantityLtr : 0);
  });

  constructor() {
    addIcons({ chevronBack, chevronForward });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected async changeMonth(delta: number): Promise<void> {
    const d = this.monthDate();
    this.monthDate.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    await this.loadMonth();
  }

  protected async markNotDelivered(slot: MilkSlot): Promise<void> {
    await firstValueFrom(
      this.dashboardApi.setMilkDeliveryOverride(this.householdUserId, toDateOnlyString(new Date()), { slot, status: 'Missed' }),
    );
    await this.toast(`marked ${slot.toLowerCase()} as not delivered — they'll see this on their side`);
    await this.load();
  }

  protected async markDelivered(slot: MilkSlot): Promise<void> {
    await firstValueFrom(
      this.dashboardApi.setMilkDeliveryOverride(this.householdUserId, toDateOnlyString(new Date()), {
        slot,
        status: 'Delivered',
        quantityLtr: null,
      }),
    );
    await this.toast(`marked ${slot.toLowerCase()} as delivered`);
    await this.load();
  }

  protected async addExtra(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Add extra milk',
      message: "Logs extra milk this household forgot to request — they'll see it tagged with your name.",
      inputs: [
        { name: 'slot', type: 'radio', label: 'Morning', value: 'Morning', checked: true },
        { name: 'slot', type: 'radio', label: 'Evening', value: 'Evening' },
        { name: 'qty', type: 'number', placeholder: 'quantity (L)', min: 0.1 },
        { name: 'reason', type: 'text', placeholder: 'reason (optional)' },
      ],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'add', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const qty = Number(data?.values?.qty);
    if (role !== 'confirm' || !qty || qty <= 0) return;

    await firstValueFrom(
      this.dashboardApi.addMilkExtra(this.householdUserId, {
        date: toDateOnlyString(new Date()),
        slot: data.values.slot,
        quantityLtr: qty,
        reason: data.values.reason || null,
      }),
    );
    await this.toast('extra milk logged 🥛');
    await this.load();
  }

  private async load(): Promise<void> {
    if (!this.householdUserId) return;

    this.loading.set(true);
    try {
      this.detail.set(await firstValueFrom(this.dashboardApi.getMilkCustomer(this.householdUserId)));
      await this.loadMonth();
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadMonth(): Promise<void> {
    const d = this.monthDate();
    try {
      this.month.set(await firstValueFrom(this.dashboardApi.getMilkCustomerMonth(this.householdUserId, d.getFullYear(), d.getMonth() + 1)));
    } catch {
      await this.toast("can't load that month rn 😵‍💫", 'danger');
    }
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
