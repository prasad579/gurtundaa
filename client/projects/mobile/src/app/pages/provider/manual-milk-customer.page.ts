import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ManualMilkApi,
  ManualMilkEntry,
  MilkCalendarDay,
  MilkMonth,
  ProviderCustomersApi,
  ProviderManualCustomer,
  rupeeLabel,
  shareOnWhatsApp,
  shortDateLabel,
  toDateOnlyString,
} from '@gurtundaa/shared';
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
import { callOutline, chevronBack, chevronForward, logoWhatsapp } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { MilkCalendarComponent } from '../milk/milk-calendar.component';

@Component({
  selector: 'app-manual-milk-customer',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonIcon, IonSkeletonText, MilkCalendarComponent],
  templateUrl: './manual-milk-customer.page.html',
  styleUrl: './provider.page.scss',
})
export class ManualMilkCustomerPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly providerCustomers = inject(ProviderCustomersApi);
  private readonly manualMilk = inject(ManualMilkApi);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly customerId = this.route.snapshot.paramMap.get('customerId') ?? '';

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly loading = signal(true);
  protected readonly customer = signal<ProviderManualCustomer | null>(null);
  protected readonly entries = signal<ManualMilkEntry[]>([]);
  protected readonly month = signal<MilkMonth | null>(null);

  private readonly monthDate = signal(new Date());
  protected readonly monthLabel = computed(() =>
    this.monthDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );
  protected readonly baseQuantityLtr = computed(() => this.customer()?.defaultQuantityLtr ?? 0);

  constructor() {
    addIcons({ callOutline, logoWhatsapp, chevronBack, chevronForward });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected async changeMonth(delta: number): Promise<void> {
    const d = this.monthDate();
    this.monthDate.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    await this.loadMonth();
  }

  protected logToday(): Promise<void> {
    return this.logForDate(toDateOnlyString(new Date()));
  }

  protected daySelected(day: MilkCalendarDay): Promise<void> {
    return this.logForDate(day.date);
  }

  protected async logExtra(): Promise<void> {
    const c = this.customer();
    const alert = await this.alerts.create({
      header: 'Log extra request',
      message: 'Record extra milk a customer called in to ask for.',
      inputs: [
        { name: 'slot', type: 'radio', label: '🌅 Morning', value: 'Morning', checked: (c?.defaultSlot ?? 'Morning') === 'Morning' },
        { name: 'slot', type: 'radio', label: '🌆 Evening', value: 'Evening', checked: c?.defaultSlot === 'Evening' },
        { name: 'variety', type: 'text', placeholder: 'variety (e.g. Regular, Gold)', value: c?.defaultVariety ?? undefined },
        { name: 'qty', type: 'number', placeholder: 'quantity (L)', min: 0.1 },
        { name: 'rate', type: 'number', placeholder: 'rate per litre (₹)', min: 0.1, value: c?.defaultRatePerLtr ?? undefined },
        { name: 'note', type: 'text', placeholder: 'note (optional)' },
      ],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'save', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const qty = Number(data?.values?.qty);
    const rate = Number(data?.values?.rate);
    if (role !== 'confirm' || !qty || qty <= 0 || !rate || rate <= 0) return;

    await firstValueFrom(
      this.manualMilk.addExtra(this.customerId, {
        date: toDateOnlyString(new Date()),
        slot: data.values.slot,
        variety: data.values.variety || null,
        quantityLtr: qty,
        ratePerLtr: rate,
        note: data.values.note || null,
      }),
    );
    await this.toast('extra logged 🥛');
    await this.load();
  }

  protected async logReturn(): Promise<void> {
    const c = this.customer();
    const alert = await this.alerts.create({
      header: 'Log return',
      message: 'Record milk the shop handed back (unsold/spoiled) — subtracts from their totals.',
      inputs: [
        { name: 'slot', type: 'radio', label: '🌅 Morning', value: 'Morning', checked: (c?.defaultSlot ?? 'Morning') === 'Morning' },
        { name: 'slot', type: 'radio', label: '🌆 Evening', value: 'Evening', checked: c?.defaultSlot === 'Evening' },
        { name: 'variety', type: 'text', placeholder: 'variety (e.g. Regular, Gold)', value: c?.defaultVariety ?? undefined },
        { name: 'qty', type: 'number', placeholder: 'quantity returned (L)', min: 0.1 },
        { name: 'rate', type: 'number', placeholder: 'rate per litre (₹)', min: 0.1, value: c?.defaultRatePerLtr ?? undefined },
        { name: 'note', type: 'text', placeholder: 'note (optional)' },
      ],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'save', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const qty = Number(data?.values?.qty);
    const rate = Number(data?.values?.rate);
    if (role !== 'confirm' || !qty || qty <= 0 || !rate || rate <= 0) return;

    await firstValueFrom(
      this.manualMilk.addReturn(this.customerId, {
        date: toDateOnlyString(new Date()),
        slot: data.values.slot,
        variety: data.values.variety || null,
        quantityLtr: qty,
        ratePerLtr: rate,
        note: data.values.note || null,
      }),
    );
    await this.toast('return logged ↩️');
    await this.load();
  }

  protected async togglePaid(entry: ManualMilkEntry): Promise<void> {
    await firstValueFrom(this.manualMilk.setPaid(this.customerId, entry.id, { isPaid: !entry.isPaid }));
    await this.load();
  }

  protected async shareLinkCode(): Promise<void> {
    const updated = await firstValueFrom(this.providerCustomers.generateLinkCode(this.customerId));
    this.customer.set(updated);
    if (!updated.linkCode) return;

    const alert = await this.alerts.create({
      header: 'Share with your customer',
      message: `If they sign up for Gurtundaa themselves, this code links your records to their account:\n\n${updated.linkCode}`,
      buttons: [
        'close',
        ...(updated.phone
          ? [
              {
                text: 'Share via WhatsApp',
                handler: () =>
                  shareOnWhatsApp(updated.phone!, `Hi ${updated.name}! Use this code to link your Gurtundaa account to me: ${updated.linkCode}`),
              },
            ]
          : []),
      ],
    });
    await alert.present();
  }

  protected askOnWhatsApp(): void {
    const c = this.customer();
    if (!c?.phone) return;
    shareOnWhatsApp(c.phone, `Hi ${c.name}, how much milk do you need today? 🥛`);
  }

  protected telLink(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  private async logForDate(date: string): Promise<void> {
    const c = this.customer();
    const slot = c?.defaultSlot ?? 'Morning';
    const resolvedDay = this.month()?.days.find((d) => d.date === date);
    const resolvedSlot = resolvedDay ? (slot === 'Evening' ? resolvedDay.evening : resolvedDay.morning) : null;

    const alert = await this.alerts.create({
      header: `Log order — ${shortDateLabel(date)}`,
      inputs: [
        { name: 'slot', type: 'radio', label: '🌅 Morning', value: 'Morning', checked: slot === 'Morning' },
        { name: 'slot', type: 'radio', label: '🌆 Evening', value: 'Evening', checked: slot === 'Evening' },
        { name: 'variety', type: 'text', placeholder: 'variety (e.g. Regular, Gold)', value: c?.defaultVariety ?? undefined },
        { name: 'qty', type: 'number', placeholder: 'quantity (L)', min: 0.1, value: resolvedSlot?.quantityLtr || c?.defaultQuantityLtr || undefined },
        { name: 'rate', type: 'number', placeholder: 'rate per litre (₹)', min: 0.1, value: c?.defaultRatePerLtr ?? undefined },
      ],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'save', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const qty = Number(data?.values?.qty);
    const rate = Number(data?.values?.rate);
    if (role !== 'confirm' || !qty || qty <= 0 || !rate || rate <= 0) return;

    await firstValueFrom(
      this.manualMilk.upsert(this.customerId, { date, slot: data.values.slot, variety: data.values.variety || null, quantityLtr: qty, ratePerLtr: rate }),
    );
    await this.toast('order logged 🥛');
    await this.load();
  }

  private async load(): Promise<void> {
    if (!this.customerId) return;

    this.loading.set(true);
    try {
      const [customers, entries] = await Promise.all([
        firstValueFrom(this.providerCustomers.list()),
        firstValueFrom(this.manualMilk.list(this.customerId)),
      ]);
      const customer = customers.find((c) => c.id === this.customerId) ?? null;
      if (!customer) {
        await this.router.navigateByUrl('/provider/milk', { replaceUrl: true });
        return;
      }
      this.customer.set(customer);
      this.entries.set(entries);
      await this.loadMonth();
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadMonth(): Promise<void> {
    const d = this.monthDate();
    this.month.set(await firstValueFrom(this.manualMilk.getMonth(this.customerId, d.getFullYear(), d.getMonth() + 1)));
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
