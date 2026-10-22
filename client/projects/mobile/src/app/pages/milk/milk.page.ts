import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BillData,
  BillLineItem,
  MILK_SLOT_LABELS,
  MILK_STATUS_LABELS,
  MilkActivityItem,
  MilkApi,
  MilkCalendarDay,
  MilkExtraRequestItem,
  MilkMonth,
  MilkPause,
  MilkPayment,
  MilkProviderPaymentInfo,
  MilkQuantityChange,
  MilkSlot,
  MilkSlotState,
  SaveMilkExtraRequestRequest,
  SaveMilkPauseRequest,
  SaveMilkQuantityChangeRequest,
  MilkSubscription,
  MilkToday,
  ServiceContact,
  ServiceContactsApi,
  deliveryWindowLabel,
  formatWhatsAppBill,
  isFutureDate,
  litresLabel,
  pauseRangeLabel,
  payViaUpi,
  rupeeLabel,
  rupeesInWords,
  shareOnWhatsApp,
  shortDateLabel,
  timeOfDayLabel,
  toDateOnlyString,
  waLink,
} from '@gurtundaa/shared';
import {
  ActionSheetController,
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
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
import {
  add,
  addOutline,
  callOutline,
  checkmark,
  checkmarkDoneOutline,
  chevronBack,
  chevronForward,
  close,
  createOutline,
  logoWhatsapp,
  pause,
  pauseOutline,
  shareSocialOutline,
  trash,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { shareText } from '../../services/share';
import { MilkCalendarComponent } from './milk-calendar.component';
import { MilkExtraEditorComponent } from './milk-extra-editor.component';
import { MilkPauseEditorComponent } from './milk-pause-editor.component';
import { MilkQuantityChangeEditorComponent } from './milk-quantity-change-editor.component';
import { MilkSubscriptionEditorComponent, SaveMilkSubscriptionFormResult } from './milk-subscription-editor.component';

type UpcomingCard =
  | { kind: 'extra'; data: MilkExtraRequestItem }
  | { kind: 'pause'; data: MilkPause }
  | { kind: 'quantityChange'; data: MilkQuantityChange };

@Component({
  selector: 'app-milk',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonSkeletonText,
    MilkCalendarComponent,
  ],
  templateUrl: './milk.page.html',
  styleUrl: './milk.page.scss',
})
export class MilkPage implements ViewWillEnter {
  private readonly milk = inject(MilkApi);
  private readonly contacts = inject(ServiceContactsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly alerts = inject(AlertController);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly router = inject(Router);

  protected readonly slotLabels = MILK_SLOT_LABELS;
  protected readonly litresLabel = litresLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly pauseRangeLabel = pauseRangeLabel;
  protected readonly timeOfDayLabel = timeOfDayLabel;
  protected readonly rupeeLabel = rupeeLabel;

  protected readonly loading = signal(true);
  protected readonly subscription = signal<MilkSubscription | null>(null);
  protected readonly contact = signal<ServiceContact | null>(null);
  protected readonly isSelfCollected = computed(() => this.subscription()?.isSelfCollected ?? false);
  protected readonly today = signal<MilkToday | null>(null);
  protected readonly month = signal<MilkMonth | null>(null);
  protected readonly payments = signal<MilkPayment[]>([]);
  protected readonly providerPaymentInfo = signal<MilkProviderPaymentInfo | null>(null);
  protected readonly balanceDue = computed(() => {
    const m = this.month();
    return m ? Math.max(0, m.summary.totalAmount - m.summary.paidSoFar) : 0;
  });
  protected readonly pauses = signal<MilkPause[]>([]);
  protected readonly extras = signal<MilkExtraRequestItem[]>([]);
  protected readonly quantityChanges = signal<MilkQuantityChange[]>([]);
  protected readonly allExtras = signal<MilkExtraRequestItem[]>([]);
  protected readonly activity = signal<MilkActivityItem[]>([]);

  private readonly monthDate = signal(new Date());
  protected readonly monthLabel = computed(() =>
    this.monthDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );

  protected readonly morningWindow = computed(() => {
    const sub = this.subscription();
    return sub ? deliveryWindowLabel(sub.morningWindowStart, sub.morningWindowEnd) : null;
  });

  protected readonly eveningWindow = computed(() => {
    const sub = this.subscription();
    return sub ? deliveryWindowLabel(sub.eveningWindowStart, sub.eveningWindowEnd) : null;
  });

  protected readonly baseQuantityLtr = computed(() => {
    const sub = this.subscription();
    if (!sub) return 0;
    return (sub.morningEnabled ? sub.morningQuantityLtr : 0) + (sub.eveningEnabled ? sub.eveningQuantityLtr : 0);
  });

  protected todaySlotAmount(slot: MilkSlotState): number {
    const sub = this.subscription();
    return sub ? slot.quantityLtr * sub.ratePerLtr : 0;
  }

  protected slotHint(slot: MilkSlotState): string | null {
    switch (slot.status) {
      case 'Delivered':
        return "Great! You're on track for this month. 🎉";
      case 'Missed':
        return 'No worries — you can request extra milk later to make up for it.';
      default:
        return null;
    }
  }

  // The soonest upcoming (or currently active) pause, shown side-by-side with Today's Delivery.
  protected readonly activePause = computed(() => this.pauses()[0] ?? null);

  protected readonly todayRowCardCount = computed(() => {
    const t = this.today();
    let count = 0;
    if (t?.morning.enabled) count++;
    if (t?.evening.enabled) count++;
    if (this.activePause()) count++;
    return count;
  });

  protected readonly upcomingCards = computed(() => {
    const cards: UpcomingCard[] = [
      ...this.extras().map((data): UpcomingCard => ({ kind: 'extra', data })),
      ...this.pauses().map((data): UpcomingCard => ({ kind: 'pause', data })),
      ...this.quantityChanges().map((data): UpcomingCard => ({ kind: 'quantityChange', data })),
    ];
    const dateOf = (c: UpcomingCard) => (c.kind === 'extra' ? c.data.date : c.data.startDate);
    return cards.sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
  });

  constructor() {
    addIcons({
      add,
      addOutline,
      callOutline,
      logoWhatsapp,
      createOutline,
      pauseOutline,
      trash,
      chevronBack,
      chevronForward,
      checkmark,
      close,
      pause,
      checkmarkDoneOutline,
      shareSocialOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected activityIcon(type: MilkActivityItem['type']): string {
    switch (type) {
      case 'Missed':
        return 'close';
      case 'ExtraAdded':
        return 'add';
      case 'Paused':
        return 'pause';
      default:
        return 'checkmark';
    }
  }

  protected readonly waLink = waLink;

  protected telLink(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  protected statusLabelFor(status: MilkCalendarDay['status']): string {
    if (status === 'Delivered') return this.isSelfCollected() ? 'Picked Up ✅' : 'Delivered ✅';
    if (status === 'Missed') return this.isSelfCollected() ? 'Not Picked Up ❌' : 'Missed ❌';
    return MILK_STATUS_LABELS[status];
  }

  private isBeforeStart(date: string): boolean {
    const startDate = this.subscription()?.startDate;
    return !!startDate && date < startDate;
  }

  protected async showDayDetail(day: MilkCalendarDay): Promise<void> {
    if (this.isBeforeStart(day.date)) {
      const alert = await this.alerts.create({
        header: shortDateLabel(day.date),
        message: "Tracking hadn't started yet on this day.",
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const isPlanned = day.status === 'Delivered' && isFutureDate(day.date);
    const statusLabel = isPlanned ? 'Planned 📅' : this.statusLabelFor(day.status);

    const lines: string[] = [];
    for (const [slotName, slot] of [
      ['Morning', day.morning],
      ['Evening', day.evening],
    ] as const) {
      if (!slot.enabled) continue;
      const slotIsPlanned = slot.status === 'Delivered' && isFutureDate(day.date);
      if (slot.status === 'Paused') {
        lines.push(`${this.slotLabels[slotName]}: Paused`);
      } else if (slot.status === 'Missed') {
        lines.push(`${this.slotLabels[slotName]}: ${this.isSelfCollected() ? 'Not picked up' : 'Missed'}`);
      } else {
        const verb = slotIsPlanned ? 'Expected' : this.isSelfCollected() ? 'Picked up' : 'Delivered';
        lines.push(`${this.slotLabels[slotName]}: ${verb} ${litresLabel(slot.quantityLtr)}`);
      }
    }
    for (const extra of this.allExtras().filter((e) => e.date === day.date)) {
      lines.push(`Extra (${this.slotLabels[extra.slot]}): +${litresLabel(extra.quantityLtr)}${extra.reason ? ` (${extra.reason})` : ''}`);
    }

    // Past (and today's) days get quick toggle buttons per enabled, non-paused slot so you can
    // correct the default "delivered" assumption — e.g. reconciling days before you started
    // using the app for a milk delivery that was already ongoing. Future days stay read-only;
    // nothing has happened on them yet.
    const slotEntries = ([
      ['Morning', day.morning],
      ['Evening', day.evening],
    ] as const).filter(([, slot]) => slot.enabled && slot.status !== 'Paused');

    // Past (and today's) days get quick toggle buttons per enabled, non-paused slot so you can
    // correct the default "delivered" assumption — e.g. reconciling days before you started
    // using the app for a milk delivery that was already ongoing. Future days stay read-only;
    // nothing has happened on them yet.
    const toggleButtons = isFutureDate(day.date)
      ? []
      : slotEntries.map(([slotName, slot]) => {
          const self = this.isSelfCollected();
          const text = slot.status === 'Missed'
            ? `Mark ${slotName} ${self ? 'Picked Up' : 'Delivered'}`
            : `Mark ${slotName} ${self ? 'Not Picked Up' : 'Missed'}`;
          return { text, handler: () => void this.toggleDaySlot(day.date, slotName, slot.status) };
        });

    // A persistent way to (re-)notify the milkman about a missed slot on this day, whenever —
    // not just the moment it's first marked missed, since that toast disappears.
    const notifyButtons = this.contact()
      ? slotEntries
          .filter(([, slot]) => slot.status === 'Missed')
          .map(([slotName]) => ({
            text: `Notify (${slotName})`,
            icon: 'logo-whatsapp',
            handler: () => this.notifyMissed(slotName, day.date),
          }))
      : [];

    // Lets you log extra consumed on this exact day — past or future — without re-picking the
    // date in a separate sheet.
    const addExtraButton = {
      text: 'Add Extra',
      icon: 'add',
      handler: () => void this.openExtraEditor(day.date),
    };

    // Plain text, not HTML — Ionic's alert escapes the message by default, which is what we want
    // since `reason` is free-text the user typed; `white-space: pre-line` (global styles) turns
    // the \n's into real line breaks without needing any HTML at all.
    const alert = await this.alerts.create({
      header: shortDateLabel(day.date),
      subHeader: statusLabel,
      message: lines.join('\n'),
      cssClass: 'day-detail-alert',
      buttons: [...toggleButtons, addExtraButton, ...notifyButtons, 'Close'],
    });
    await alert.present();
  }

  private async toggleDaySlot(date: string, slot: MilkSlot, currentStatus: MilkSlotState['status']): Promise<void> {
    const status = currentStatus === 'Missed' ? 'Delivered' : 'Missed';
    await firstValueFrom(this.milk.setDeliveryOverride(date, { slot, status, quantityLtr: null }));
    await this.toast(
      status === 'Missed'
        ? this.isSelfCollected() ? 'marked as not picked up' : 'marked as not delivered'
        : this.isSelfCollected() ? 'marked as picked up ✅' : 'marked as delivered ✅',
    );
    await this.load();
  }

  protected async changeMonth(delta: number): Promise<void> {
    const d = this.monthDate();
    this.monthDate.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    await this.loadMonth();
  }

  protected async toggleSettlementPaid(): Promise<void> {
    const m = this.month();
    if (!m) return;
    const d = this.monthDate();
    const isPaid = !m.summary.isPaid;
    const summary = await firstValueFrom(this.milk.setSettlementPaid(d.getFullYear(), d.getMonth() + 1, { isPaid }));
    this.month.set({ ...m, summary });
    await this.toast(isPaid ? 'marked as paid ✅' : 'marked as pending');
  }

  protected async payViaUpi(): Promise<void> {
    const info = this.providerPaymentInfo();
    const balance = this.balanceDue();
    if (!info?.upiId || balance <= 0) return;

    const amountAlert = await this.alerts.create({
      header: 'Pay via UPI',
      message: `Opens your UPI app to pay ${info.providerDisplayName ?? 'your milkman'} directly — Gurtundaa never touches the money.`,
      inputs: [{ name: 'amount', type: 'number', value: balance, min: 0.01 }],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'continue', role: 'confirm' },
      ],
    });
    await amountAlert.present();
    const { role: amountRole, data: amountData } = await amountAlert.onWillDismiss();
    const amount = Number(amountData?.values?.amount);
    if (amountRole !== 'confirm' || !amount || amount <= 0) return;

    payViaUpi(info.upiId, info.providerDisplayName ?? 'Milk Provider', amount, 'Gurtundaa milk payment');

    const confirmAlert = await this.alerts.create({
      header: 'Did you complete the payment?',
      message: "Only confirm if the UPI app showed your payment went through. This stays pending until your milkman confirms they received it.",
      buttons: [
        { text: "I didn't pay", role: 'cancel' },
        { text: "Yes, I've paid", role: 'confirm' },
      ],
    });
    await confirmAlert.present();
    const { role: confirmRole } = await confirmAlert.onWillDismiss();
    if (confirmRole !== 'confirm') return;

    await firstValueFrom(this.milk.initiateUpiPayment({ amount, note: 'Paid via UPI' }));
    await this.toast('payment recorded — awaiting confirmation ⏳');
    await this.loadMonth();
  }

  protected async recordPayment(): Promise<void> {
    const todayAmt = this.todayAmount();
    const weekAmt = this.thisWeekAmountSoFar();
    const balance = this.balanceDue();

    const alert = await this.alerts.create({
      header: 'Record a Payment',
      message: "Log what you paid — today, this week, or any custom amount — without waiting for month-end.",
      inputs: [
        ...(todayAmt > 0 ? [{ name: 'preset', type: 'radio' as const, label: `Today (${rupeeLabel(todayAmt)})`, value: String(todayAmt) }] : []),
        ...(weekAmt > 0 ? [{ name: 'preset', type: 'radio' as const, label: `This week so far (${rupeeLabel(weekAmt)})`, value: String(weekAmt) }] : []),
        ...(balance > 0 ? [{ name: 'preset', type: 'radio' as const, label: `Full balance (${rupeeLabel(balance)})`, value: String(balance) }] : []),
        { name: 'amount', type: 'number', placeholder: 'or enter a custom amount (₹)', min: 0.01 },
        { name: 'note', type: 'text', placeholder: 'note (optional)' },
      ],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'save', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    if (role !== 'confirm') return;

    const amount = Number(data?.values?.amount) || Number(data?.values?.preset);
    if (!amount || amount <= 0) return;

    await firstValueFrom(this.milk.createPayment({ date: toDateOnlyString(new Date()), amount, note: data.values.note || null }));
    await this.toast('payment recorded 💰');
    await this.loadMonth();
  }

  protected async deletePayment(payment: MilkPayment): Promise<void> {
    await firstValueFrom(this.milk.deletePayment(payment.id));
    await this.toast('payment removed');
    await this.loadMonth();
  }

  private dayAmount(day: MilkCalendarDay): number {
    const rate = this.subscription()?.ratePerLtr ?? 0;
    const morning = day.morning.enabled && day.morning.status === 'Delivered' ? day.morning.quantityLtr : 0;
    const evening = day.evening.enabled && day.evening.status === 'Delivered' ? day.evening.quantityLtr : 0;
    return (morning + evening) * rate;
  }

  private todayAmount(): number {
    const todayStr = toDateOnlyString(new Date());
    const day = this.month()?.days.find((d) => d.date === todayStr);
    return day ? this.dayAmount(day) : 0;
  }

  private thisWeekAmountSoFar(): number {
    const m = this.month();
    if (!m) return 0;
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0..Sun=6
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekStartStr = toDateOnlyString(weekStart);
    const todayStr = toDateOnlyString(today);
    return m.days.filter((d) => d.date >= weekStartStr && d.date <= todayStr).reduce((sum, d) => sum + this.dayAmount(d), 0);
  }

  protected shareSettlement(): void {
    const c = this.contact();
    const bill = this.buildSettlementBill();
    if (!c || !bill) return;
    shareOnWhatsApp(c.phone, formatWhatsAppBill(bill));
  }

  protected async shareSettlementWithOthers(): Promise<void> {
    const bill = this.buildSettlementBill();
    if (!bill) return;
    await shareText(formatWhatsAppBill(bill), bill.title);
  }

  private buildSettlementBill(): BillData | null {
    const m = this.month();
    if (!m) return null;
    const s = m.summary;
    const totalDays = s.planned + s.delivered + s.paused + s.missed;

    const items: BillLineItem[] = [
      { label: 'Regular', qty: litresLabel(s.regularLitres), rate: rupeeLabel(s.ratePerLtr), amount: rupeeLabel(s.regularAmount) },
    ];
    if (s.extraLitres > 0) {
      items.push({ label: 'Extra', qty: litresLabel(s.extraLitres), rate: rupeeLabel(s.ratePerLtr), amount: rupeeLabel(s.extraAmount) });
    }

    const dayParts: string[] = [`${s.delivered} ${this.isSelfCollected() ? 'picked up' : 'delivered'}`];
    if (s.missed > 0) dayParts.push(`${s.missed} missed`);
    if (s.paused > 0) dayParts.push(`${s.paused} paused`);
    if (s.planned > 0) dayParts.push(`${s.planned} upcoming`);

    return {
      icon: '🥛',
      title: `Milk Bill — ${this.monthLabel()}`,
      subtitleLines: [`📅 ${dayParts.join(' · ')} (of ${totalDays} days)`],
      items,
      quantitySummary: { label: 'Total Liters', value: litresLabel(s.regularLitres + s.extraLitres) },
      total: {
        label: 'Total Amount',
        amount: rupeeLabel(s.totalAmount),
        isPaid: s.isPaid,
        amountInWords: rupeesInWords(s.totalAmount),
      },
      closingLine: 'Thank you! 🙏',
    };
  }

  protected async openSubscriptionEditor(): Promise<void> {
    const modal = await this.modals.create({
      component: MilkSubscriptionEditorComponent,
      componentProps: { subscription: this.subscription(), contact: this.contact() },
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveMilkSubscriptionFormResult>();
    if (role !== 'save' || !data) {
      return;
    }

    const existingContact = this.contact();
    const contactId = data.contact
      ? (await firstValueFrom(existingContact ? this.contacts.update(existingContact.id, data.contact) : this.contacts.create(data.contact))).id
      : null;
    await firstValueFrom(this.milk.saveSubscription({ ...data.subscription, contactId }));
    await this.toast('milk subscription saved 🥛');
    await this.load();
  }

  protected async markNotDelivered(slot: MilkSlot): Promise<void> {
    const t = this.today();
    if (!t) return;
    await firstValueFrom(this.milk.setDeliveryOverride(t.date, { slot, status: 'Missed' }));
    await this.load();

    const toast = await this.toasts.create({
      message: this.isSelfCollected() ? 'marked as not picked up' : 'marked as not delivered',
      duration: 4000,
      position: 'bottom',
      buttons: this.contact() ? [{ icon: 'logo-whatsapp', text: 'Notify', handler: () => this.notifyMissed(slot) }] : [],
    });
    await toast.present();
  }

  protected async markDelivered(slot: MilkSlot): Promise<void> {
    const t = this.today();
    if (!t) return;
    await firstValueFrom(this.milk.setDeliveryOverride(t.date, { slot, status: 'Delivered', quantityLtr: null }));
    await this.toast('marked as delivered ✅');
    await this.load();
  }

  protected async editQuantity(slot: MilkSlot, current: MilkSlotState): Promise<void> {
    const t = this.today();
    if (!t) return;

    const alert = await this.alerts.create({
      header: `${slot.toLowerCase()}'s quantity`,
      inputs: [{ name: 'qty', type: 'number', value: current.quantityLtr, min: 0.1 }],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'save', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const qty = Number(data?.values?.qty);
    if (role !== 'confirm' || !qty || qty <= 0) return;

    await firstValueFrom(this.milk.setDeliveryOverride(t.date, { slot, status: 'Delivered', quantityLtr: qty }));
    await this.toast('quantity updated');
    await this.load();
  }

  protected async openPauseEditor(pause?: MilkPause): Promise<void> {
    const modal = await this.modals.create({
      component: MilkPauseEditorComponent,
      componentProps: { pause },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveMilkPauseRequest>();
    if (role !== 'save' || !data) return;

    await firstValueFrom(pause ? this.milk.updatePause(pause.id, data) : this.milk.createPause(data));
    await this.toast(pause ? 'pause updated' : 'delivery paused 🧳');
    await this.load();
  }

  protected async cancelPause(pause: MilkPause): Promise<void> {
    if (!(await this.confirmDelete('Cancel this pause?'))) return;
    await firstValueFrom(this.milk.deletePause(pause.id));
    await this.toast('pause cancelled');
    await this.load();
  }

  protected resumeDateLabel(pause: MilkPause): string {
    const end = new Date(pause.endDate);
    end.setDate(end.getDate() + 1);
    return shortDateLabel(toDateOnlyString(end));
  }

  protected notifyMilkman(pause: MilkPause): void {
    const c = this.contact();
    if (!c) return;
    shareOnWhatsApp(
      c.phone,
      `Hi ${c.name}, just a heads up: milk delivery will be paused from ` +
        `${pause.startDate} to ${pause.endDate}${pause.reason ? ` (${pause.reason})` : ''}. Thank you!`,
    );
  }

  protected notifyQuantityChange(change: MilkQuantityChange): void {
    const c = this.contact();
    if (!c) return;
    shareOnWhatsApp(
      c.phone,
      `Hi ${c.name}, just a heads up: from ${change.startDate} to ${change.endDate}, please deliver ` +
        `${litresLabel(change.morningQuantityLtr)} in the morning and ${litresLabel(change.eveningQuantityLtr)} in the evening` +
        `${change.reason ? ` (${change.reason})` : ''}. Thank you!`,
    );
  }

  protected notifyMissed(slot: MilkSlot, date?: string): void {
    const c = this.contact();
    const targetDate = date ?? this.today()?.date;
    if (!c || !targetDate) return;
    const isToday = targetDate === this.today()?.date;
    shareOnWhatsApp(
      c.phone,
      `Hi ${c.name}, I noticed ${slot.toLowerCase()} milk wasn't delivered ` +
        `${isToday ? 'today' : `on ${shortDateLabel(targetDate)}`}. Please let me know if there's an issue. Thank you!`,
    );
  }

  protected notifyExtra(extra: MilkExtraRequestItem): void {
    const c = this.contact();
    if (!c) return;
    shareOnWhatsApp(
      c.phone,
      `Hi ${c.name}, I need extra milk on ${shortDateLabel(extra.date)}: ` +
        `+${litresLabel(extra.quantityLtr)} in the ${this.slotLabels[extra.slot].replace(/^\S+\s/, '').toLowerCase()}` +
        `${extra.reason ? ` (${extra.reason})` : ''}. Thank you!`,
    );
  }

  protected async openExtraEditor(initialDate?: string): Promise<void> {
    const modal = await this.modals.create({
      component: MilkExtraEditorComponent,
      componentProps: initialDate ? { initialDate } : undefined,
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveMilkExtraRequestRequest[]>();
    if (role !== 'save' || !data || data.length === 0) return;

    const created = await Promise.all(data.map((request) => firstValueFrom(this.milk.createExtraRequest(request))));
    await this.load();

    const message = created.length === 1 ? 'extra milk requested 🥛' : `extra milk requested for ${created.length} days 🥛`;
    const toast = await this.toasts.create({
      message,
      duration: 4000,
      position: 'bottom',
      buttons:
        created.length === 1 && this.contact()
          ? [{ icon: 'logo-whatsapp', text: 'Notify', handler: () => this.notifyExtra(created[0]) }]
          : [],
    });
    await toast.present();
  }

  protected async cancelExtra(extra: MilkExtraRequestItem): Promise<void> {
    if (!(await this.confirmDelete('Remove this extra milk request?'))) return;
    await firstValueFrom(this.milk.deleteExtraRequest(extra.id));
    await this.toast('extra request cancelled');
    await this.load();
  }

  protected async openQuantityChangeEditor(change?: MilkQuantityChange): Promise<void> {
    const modal = await this.modals.create({
      component: MilkQuantityChangeEditorComponent,
      componentProps: { change, subscription: this.subscription() },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveMilkQuantityChangeRequest>();
    if (role !== 'save' || !data) return;

    await firstValueFrom(change ? this.milk.updateQuantityChange(change.id, data) : this.milk.createQuantityChange(data));
    await this.toast(change ? 'quantity change updated' : 'quantity change scheduled 🥛');
    await this.load();
  }

  protected async cancelQuantityChange(change: MilkQuantityChange): Promise<void> {
    if (!(await this.confirmDelete('Cancel this quantity change?'))) return;
    await firstValueFrom(this.milk.deleteQuantityChange(change.id));
    await this.toast('quantity change cancelled');
    await this.load();
  }

  protected async openAddSheet(): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'Add to schedule',
      buttons: [
        { text: 'Request Extra Milk', icon: 'add-outline', handler: () => void this.openExtraEditor() },
        { text: 'Change Quantity', icon: 'create-outline', handler: () => void this.openQuantityChangeEditor() },
        {
          text: this.isSelfCollected() ? 'Pause Pickup' : 'Pause Delivery',
          icon: 'pause-outline',
          handler: () => void this.router.navigateByUrl('/milk-pause'),
        },
        { text: 'cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async loadMonth(): Promise<void> {
    const d = this.monthDate();
    const [month, payments] = await Promise.all([
      firstValueFrom(this.milk.getMonth(d.getFullYear(), d.getMonth() + 1)),
      firstValueFrom(this.milk.listPayments(d.getFullYear(), d.getMonth() + 1)),
    ]);
    this.month.set(month);
    this.payments.set(payments);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [subscription, contacts] = await Promise.all([
        firstValueFrom(this.milk.getSubscription()),
        firstValueFrom(this.contacts.list('Milk')),
      ]);
      this.subscription.set(subscription);
      this.contact.set(contacts[0] ?? null);

      if (subscription) {
        const [today, pauses, extras, allExtras, quantityChanges, activity, providerPaymentInfo] = await Promise.all([
          firstValueFrom(this.milk.getToday()),
          firstValueFrom(this.milk.listPauses(true)),
          firstValueFrom(this.milk.listExtraRequests(true)),
          firstValueFrom(this.milk.listExtraRequests(false)),
          firstValueFrom(this.milk.listQuantityChanges(true)),
          firstValueFrom(this.milk.getActivity(10)),
          firstValueFrom(this.milk.getProviderPaymentInfo()),
        ]);
        this.today.set(today);
        this.pauses.set(pauses);
        this.extras.set(extras);
        this.allExtras.set(allExtras);
        this.quantityChanges.set(quantityChanges);
        this.activity.set(activity);
        this.providerPaymentInfo.set(providerPaymentInfo);
        void firstValueFrom(this.milk.markProviderActivitySeen());
        await this.loadMonth();
      }
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alerts.create({
      header: 'Delete?',
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onWillDismiss();
    return role === 'destructive';
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
