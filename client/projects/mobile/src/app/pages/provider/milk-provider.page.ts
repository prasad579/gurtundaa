import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ManualMilkApi,
  ManualMilkDaySummary,
  MilkCalendarStatus,
  PendingMilkPayment,
  ProviderCustomersApi,
  ProviderDashboardApi,
  ProviderLinksApi,
  ProviderManualCustomer,
  ProviderMilkDashboard,
  ProviderPaymentSettings,
  ProviderPaymentSettingsApi,
  rupeeLabel,
  shareOnWhatsApp,
  shortDateLabel,
} from '@gurtundaa/shared';
import {
  AlertController,
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
import { add, callOutline, chevronBack, chevronForward, createOutline, linkOutline, locationOutline, logoWhatsapp } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AddManualCustomerComponent } from './add-manual-customer.component';
import { MilkDayDetailComponent } from './milk-day-detail.component';

@Component({
  selector: 'app-milk-provider',
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
  templateUrl: './milk-provider.page.html',
  styleUrl: './provider.page.scss',
})
export class MilkProviderPage implements ViewWillEnter {
  private readonly dashboardApi = inject(ProviderDashboardApi);
  private readonly links = inject(ProviderLinksApi);
  private readonly manualCustomers = inject(ProviderCustomersApi);
  private readonly manualMilk = inject(ManualMilkApi);
  private readonly paymentSettingsApi = inject(ProviderPaymentSettingsApi);
  private readonly modals = inject(ModalController);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly router = inject(Router);

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly loading = signal(true);
  protected readonly dashboard = signal<ProviderMilkDashboard | null>(null);
  protected readonly manual = signal<ProviderManualCustomer[]>([]);
  protected readonly linkCode = signal('');
  protected readonly linking = signal(false);

  protected readonly monthDate = signal(new Date());
  protected readonly monthLabel = computed(() =>
    this.monthDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );
  protected readonly monthSummary = signal<ManualMilkDaySummary[]>([]);
  protected readonly hasAnyManualDays = computed(() => this.monthSummary().some((d) => d.customerCount > 0));
  protected readonly paymentSettings = signal<ProviderPaymentSettings | null>(null);
  protected readonly pendingPayments = signal<PendingMilkPayment[]>([]);

  constructor() {
    addIcons({ linkOutline, callOutline, locationOutline, add, logoWhatsapp, chevronBack, chevronForward, createOutline });
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
    void this.router.navigateByUrl(`/provider/milk/customers/${householdUserId}`);
  }

  protected openManualCustomer(id: string): void {
    void this.router.navigateByUrl(`/provider/milk/manual-customers/${id}`);
  }

  protected askOnWhatsApp(name: string, phone: string | null): void {
    if (!phone) return;
    shareOnWhatsApp(phone, `Hi ${name}, how much milk do you need today? 🥛`);
  }

  protected async addManualCustomer(): Promise<void> {
    const modal = await this.modals.create({
      component: AddManualCustomerComponent,
      componentProps: { showMilkDefaults: true },
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

  protected statusEmoji(status: MilkCalendarStatus): string {
    switch (status) {
      case 'Paused':
        return '⏸️';
      case 'Missed':
        return '❌';
      default:
        return '🏠';
    }
  }

  protected async editUpiId(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'UPI Payment Settings',
      message: "Customers will pay this UPI ID directly from their own app — Gurtundaa never touches the money.",
      inputs: [{ name: 'upiId', type: 'text', placeholder: 'yourname@upi', value: this.paymentSettings()?.upiId ?? '' }],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'save', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    if (role !== 'confirm') return;

    const settings = await firstValueFrom(this.paymentSettingsApi.save({ upiId: data.values.upiId || null }));
    this.paymentSettings.set(settings);
    await this.toast(settings.upiId ? 'UPI ID saved ✅' : 'UPI ID removed');
  }

  protected async confirmPayment(payment: PendingMilkPayment): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Confirm payment received?',
      message: `Only confirm if you've checked your own UPI app/bank and actually received ${rupeeLabel(payment.amount)} from ${payment.householdName}.`,
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'yes, received it', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onWillDismiss();
    if (role !== 'confirm') return;

    await firstValueFrom(this.dashboardApi.confirmMilkPayment(payment.id));
    await this.toast('payment confirmed ✅');
    await this.load();
  }

  protected async rejectPayment(payment: PendingMilkPayment): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Mark as not received?',
      message: `${payment.householdName} will see this payment as rejected and will need to pay again.`,
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'not received', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onWillDismiss();
    if (role !== 'destructive') return;

    await firstValueFrom(this.dashboardApi.rejectMilkPayment(payment.id));
    await this.toast('marked as not received');
    await this.load();
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  protected async changeMonth(delta: number): Promise<void> {
    const d = this.monthDate();
    this.monthDate.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    await this.loadMonthSummary();
  }

  protected async openDay(date: string): Promise<void> {
    const modal = await this.modals.create({ component: MilkDayDetailComponent, componentProps: { date } });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'manage' && data?.providerCustomerId) {
      this.openManualCustomer(data.providerCustomerId);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [dashboard, manual, paymentSettings, pendingPayments] = await Promise.all([
        firstValueFrom(this.dashboardApi.getMilkDashboard()),
        firstValueFrom(this.manualCustomers.list()),
        firstValueFrom(this.paymentSettingsApi.get()),
        firstValueFrom(this.dashboardApi.listPendingMilkPayments()),
      ]);
      this.dashboard.set(dashboard);
      this.manual.set(manual);
      this.paymentSettings.set(paymentSettings);
      this.pendingPayments.set(pendingPayments);
      await this.loadMonthSummary();
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadMonthSummary(): Promise<void> {
    const d = this.monthDate();
    this.monthSummary.set(await firstValueFrom(this.manualMilk.getProviderMonthSummary(d.getFullYear(), d.getMonth() + 1)));
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
