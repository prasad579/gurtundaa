import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BillData,
  BillLineItem,
  MILK_SLOT_LABELS,
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
  parseDateOnly,
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
  ellipsisHorizontal,
  logoWhatsapp,
  pause,
  pauseOutline,
  shareSocialOutline,
  trash,
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { shareText } from '../../services/share';
import { MilkCalendarComponent } from './milk-calendar.component';
import { MilkDayDetailAction, MilkDayDetailSheetComponent } from './milk-day-detail-sheet.component';
import { MilkDayListSheetComponent } from './milk-day-list-sheet.component';
import { MilkExtraEditorComponent } from './milk-extra-editor.component';
import { MilkPauseEditorComponent } from './milk-pause-editor.component';
import { MilkQuantityChangeEditorComponent } from './milk-quantity-change-editor.component';
import { MilkRecordPaymentSheetComponent, RecordMilkPaymentResult } from './milk-record-payment-sheet.component';
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
    TranslatePipe,
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
  private readonly translate = inject(TranslateService);

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
        return this.translate.instant('milk.onTrackHint');
      case 'Missed':
        return this.translate.instant('milk.missedHint');
      default:
        return null;
    }
  }

  // The soonest upcoming (or currently active) pause, shown side-by-side with Today's Delivery.
  protected readonly activePause = computed(() => this.pauses()[0] ?? null);

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
      ellipsisHorizontal,
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

  protected heroSummaryLabel(t: MilkToday): string {
    const slots = [t.morning, t.evening].filter((s) => s.enabled);
    if (slots.some((s) => s.status === 'Missed')) {
      return this.translate.instant('milk.heroNeedsAttention');
    }
    return this.translate.instant(slots.length > 1 ? 'milk.heroOnTrack' : 'milk.heroOnTrackSingle');
  }

  protected statusLabelFor(status: MilkCalendarDay['status']): string {
    if (status === 'Delivered') return this.translate.instant(this.isSelfCollected() ? 'milk.pickedUpCheck' : 'milk.deliveredCheck');
    if (status === 'Missed') return this.translate.instant(this.isSelfCollected() ? 'milk.notPickedUpCross' : 'milk.missedCross');
    return this.translate.instant('milk.pausedCheck');
  }

  private isBeforeStart(date: string): boolean {
    const startDate = this.subscription()?.startDate;
    return !!startDate && date < startDate;
  }

  // Mirrors app-milk-calendar's own cellClass() so the "which days" list matches exactly what's
  // drawn on the calendar strip — a day isn't "delivered" just because its status says so if the
  // date hasn't happened yet (it's "planned") or tracking hadn't started yet (it's "not-tracked").
  private dayDisplayStatus(day: MilkCalendarDay): 'not-tracked' | 'planned' | 'delivered' | 'missed' | 'paused' {
    if (this.isBeforeStart(day.date)) {
      return 'not-tracked';
    }
    if (day.status === 'Delivered' && isFutureDate(day.date)) {
      return 'planned';
    }
    return day.status.toLowerCase() as 'delivered' | 'missed' | 'paused';
  }

  protected async showDaysForStatus(status: 'planned' | 'delivered' | 'missed' | 'paused'): Promise<void> {
    // Delivered/Paused/Missed are "already happened" tallies — matches MilkDeliveryService's own
    // `date > today` cutoff server-side, since that count also drives billing. A future day inside
    // e.g. a pause range still shows as paused on the calendar itself, but hasn't "happened" yet,
    // so it's excluded here too — otherwise this list's count would never match the stat card's.
    const today = toDateOnlyString(new Date());
    const days = (this.month()?.days ?? []).filter(
      (d) => this.dayDisplayStatus(d) === status && (status === 'planned' || d.date <= today),
    );
    if (days.length === 0) return;

    const statusKey =
      status === 'delivered' ? (this.isSelfCollected() ? 'milk.pickedUp' : 'milk.delivered') : `milk.${status}`;
    const modal = await this.modals.create({
      component: MilkDayListSheetComponent,
      componentProps: { title: this.translate.instant('milk.daysTitle', { status: this.translate.instant(statusKey) }), days },
      breakpoints: [0, 0.6, 0.95],
      initialBreakpoint: 0.6,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<MilkCalendarDay>();
    if (role === 'select' && data) {
      await this.showDayDetail(data);
    }
  }

  protected async showDayDetail(day: MilkCalendarDay): Promise<void> {
    if (this.isBeforeStart(day.date)) {
      const alert = await this.alerts.create({
        header: shortDateLabel(day.date),
        message: this.translate.instant('milk.trackingNotStarted'),
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const isPlanned = day.status === 'Delivered' && isFutureDate(day.date);
    const statusLabel = isPlanned ? this.translate.instant('milk.plannedChip') : this.statusLabelFor(day.status);
    const dayExtras = this.allExtras().filter((e) => e.date === day.date);

    const modal = await this.modals.create({
      component: MilkDayDetailSheetComponent,
      componentProps: {
        date: day.date,
        statusLabel,
        morning: day.morning,
        evening: day.evening,
        extras: dayExtras,
        isSelfCollected: this.isSelfCollected(),
        hasContact: !!this.contact(),
        isPaused: day.status === 'Paused',
      },
      breakpoints: [0, 0.6, 0.95],
      initialBreakpoint: 0.6,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<MilkDayDetailAction>();
    if (role !== 'action' || !data) return;

    switch (data.kind) {
      case 'toggleSlot': {
        const currentStatus = data.slot === 'Morning' ? day.morning.status : day.evening.status;
        await this.toggleDaySlot(day.date, data.slot, currentStatus);
        break;
      }
      case 'changeQuantity':
        await this.openQuantityChangeEditor(undefined, day.date);
        break;
      case 'pauseFromHere':
        await this.openPauseEditor(undefined, day.date);
        break;
      case 'editPause':
        await this.editPauseForDate(day.date);
        break;
      case 'addExtra':
        await this.openExtraEditor(day.date);
        break;
      case 'removeExtra': {
        const extra = dayExtras.find((e) => e.id === data.extraId);
        if (extra) await this.cancelExtra(extra);
        break;
      }
      case 'notifySlot':
        this.notifyMissed(data.slot, day.date);
        break;
    }
  }

  private async editPauseForDate(date: string): Promise<void> {
    const pauses = await firstValueFrom(this.milk.listPauses(false));
    const pause = pauses.find((p) => p.startDate <= date && p.endDate >= date);
    if (!pause) {
      await this.toast(this.translate.instant('milk.toastServerError'), 'danger');
      return;
    }
    await this.openPauseEditor(pause);
  }

  private async toggleDaySlot(date: string, slot: MilkSlot, currentStatus: MilkSlotState['status']): Promise<void> {
    const status = currentStatus === 'Missed' ? 'Delivered' : 'Missed';
    await firstValueFrom(this.milk.setDeliveryOverride(date, { slot, status, quantityLtr: null }));
    await this.toast(
      this.translate.instant(
        status === 'Missed'
          ? this.isSelfCollected() ? 'milk.notPickedUpToast' : 'milk.notDeliveredToast'
          : this.isSelfCollected() ? 'milk.pickedUpToast' : 'milk.deliveredToast',
      ),
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
    await this.toast(this.translate.instant(isPaid ? 'milk.markedPaidToast' : 'milk.markedPendingToast'));
  }

  protected async payViaUpi(): Promise<void> {
    const info = this.providerPaymentInfo();
    const balance = this.balanceDue();
    if (!info?.upiId || balance <= 0) return;

    const amountAlert = await this.alerts.create({
      header: this.translate.instant('milk.payUpiTitle'),
      message: this.translate.instant('milk.payUpiMessage', { name: info.providerDisplayName ?? this.translate.instant('milk.defaultMilkman') }),
      inputs: [{ name: 'amount', type: 'number', value: balance, min: 0.01 }],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('milk.continueBtn'), role: 'confirm' },
      ],
    });
    await amountAlert.present();
    const { role: amountRole, data: amountData } = await amountAlert.onWillDismiss();
    const amount = Number(amountData?.values?.amount);
    if (amountRole !== 'confirm' || !amount || amount <= 0) return;

    payViaUpi(info.upiId, info.providerDisplayName ?? 'Milk Provider', amount, 'Gurtundaa milk payment');

    const confirmAlert = await this.alerts.create({
      header: this.translate.instant('milk.confirmPaymentTitle'),
      message: this.translate.instant('milk.confirmPaymentMessage'),
      buttons: [
        { text: this.translate.instant('milk.didntPay'), role: 'cancel' },
        { text: this.translate.instant('milk.yesPaid'), role: 'confirm' },
      ],
    });
    await confirmAlert.present();
    const { role: confirmRole } = await confirmAlert.onWillDismiss();
    if (confirmRole !== 'confirm') return;

    await firstValueFrom(this.milk.initiateUpiPayment({ amount, note: 'Paid via UPI' }));
    await this.toast(this.translate.instant('milk.paymentRecordedAwaiting'));
    await this.loadMonth();
  }

  protected async recordPayment(): Promise<void> {
    const modal = await this.modals.create({
      component: MilkRecordPaymentSheetComponent,
      componentProps: {
        todayAmount: this.todayAmount(),
        weekAmount: this.thisWeekAmountSoFar(),
        balanceAmount: this.balanceDue(),
      },
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.6,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<RecordMilkPaymentResult>();
    if (role !== 'save' || !data || data.amount <= 0) return;

    await firstValueFrom(this.milk.createPayment({ date: toDateOnlyString(new Date()), amount: data.amount, note: data.note }));
    await this.toast(this.translate.instant('milk.paymentRecorded'));
    await this.loadMonth();
  }

  protected async deletePayment(payment: MilkPayment): Promise<void> {
    await firstValueFrom(this.milk.deletePayment(payment.id));
    await this.toast(this.translate.instant('milk.paymentRemoved'));
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
    const monthDate = this.monthDate();
    const monthName = monthDate.toLocaleDateString(undefined, { month: 'long' });
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

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

    // Counts alone ("15 paused") don't say *which* days — spelling them out here is what actually
    // lets the milkman (or the household) sanity-check the bill against what really happened.
    const subtitleLines = [`📅 ${monthName} has ${daysInMonth} days — ${dayParts.join(' · ')}`];

    const pausedDates = new Set(m.days.filter((d) => d.status === 'Paused').map((d) => d.date));
    const pausedRanges = this.groupConsecutiveDates([...pausedDates]);
    if (pausedRanges.length > 0) {
      subtitleLines.push(`⏸️ Paused: ${pausedRanges.join(', ')}`);
    }

    const firstDate = m.days[0]?.date;
    const lastDate = m.days[m.days.length - 1]?.date;
    // Extras requested on a day that later got paused aren't billed (excluded from extraLitres
    // above) — leaving them out here too, so the message never shows a day that isn't reflected
    // in the total.
    const monthExtras = this.allExtras().filter(
      (e) => firstDate && lastDate && e.date >= firstDate && e.date <= lastDate && !pausedDates.has(e.date),
    );
    if (monthExtras.length > 0) {
      const extraParts = monthExtras.map((e) => `${shortDateLabel(e.date)} +${litresLabel(e.quantityLtr)}`);
      subtitleLines.push(`🥛 Extra: ${extraParts.join(', ')}`);
    }

    return {
      icon: '🥛',
      title: `Milk Bill — ${this.monthLabel()}`,
      subtitleLines,
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

  /** Collapses sorted-or-not `DateOnly` strings into "11 Oct – 25 Oct (15 days)"-style ranges, splitting wherever there's a gap. */
  private groupConsecutiveDates(dates: string[]): string[] {
    const sorted = [...dates].sort();
    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      const current = sorted[i];
      const isConsecutive = current !== undefined && parseDateOnly(current).getTime() - parseDateOnly(prev).getTime() === 86_400_000;
      if (!isConsecutive) {
        ranges.push(pauseRangeLabel(rangeStart, prev));
        rangeStart = current;
      }
      prev = current;
    }

    return ranges;
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
    await this.toast(this.translate.instant('milk.subscriptionSaved'));
    await this.load();
  }

  protected async markNotDelivered(slot: MilkSlot): Promise<void> {
    const t = this.today();
    if (!t) return;
    await firstValueFrom(this.milk.setDeliveryOverride(t.date, { slot, status: 'Missed' }));
    await this.load();

    const toast = await this.toasts.create({
      message: this.translate.instant(this.isSelfCollected() ? 'milk.notPickedUpToast' : 'milk.notDeliveredToast'),
      duration: 4000,
      position: 'bottom',
      buttons: this.contact() ? [{ icon: 'logo-whatsapp', text: this.translate.instant('milk.notify'), handler: () => this.notifyMissed(slot) }] : [],
    });
    await toast.present();
  }

  protected async markDelivered(slot: MilkSlot): Promise<void> {
    const t = this.today();
    if (!t) return;
    await firstValueFrom(this.milk.setDeliveryOverride(t.date, { slot, status: 'Delivered', quantityLtr: null }));
    await this.toast(this.translate.instant('milk.deliveredToast'));
    await this.load();
  }

  protected async editQuantity(slot: MilkSlot, current: MilkSlotState): Promise<void> {
    const t = this.today();
    if (!t) return;

    const alert = await this.alerts.create({
      header: this.translate.instant('milk.quantityLabel', { slot: this.translate.instant(slot === 'Morning' ? 'milk.morningLower' : 'milk.eveningLower') }),
      inputs: [{ name: 'qty', type: 'number', value: current.quantityLtr, min: 0.1 }],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('common.save'), role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const qty = Number(data?.values?.qty);
    if (role !== 'confirm' || !qty || qty <= 0) return;

    await firstValueFrom(this.milk.setDeliveryOverride(t.date, { slot, status: 'Delivered', quantityLtr: qty }));
    await this.toast(this.translate.instant('milk.quantityUpdated'));
    await this.load();
  }

  // The hero card's tap-circle handles the delivered/missed toggle directly; this "⋯" menu is for
  // the less-frequent actions (precise quantity, re-notifying) so the circle stays a single tap.
  protected async openSlotMenu(slot: MilkSlot, state: MilkSlotState): Promise<void> {
    const sheet = await this.actionSheets.create({
      buttons: [
        { text: this.translate.instant('milk.editQty'), icon: 'create-outline', handler: () => void this.editQuantity(slot, state) },
        ...(state.status === 'Missed' && this.contact()
          ? [{ text: this.translate.instant('milk.notify'), icon: 'logo-whatsapp', handler: () => this.notifyMissed(slot) }]
          : []),
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  // "Resume Now" ends the pause as of today: if it started today (or later), there's nothing to
  // shrink, so it's just cancelled outright; otherwise its end date moves to yesterday.
  protected async resumeNow(pause: MilkPause): Promise<void> {
    const todayStr = toDateOnlyString(new Date());
    if (pause.startDate >= todayStr) {
      await firstValueFrom(this.milk.deletePause(pause.id));
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await firstValueFrom(
        this.milk.updatePause(pause.id, { startDate: pause.startDate, endDate: toDateOnlyString(yesterday), reason: pause.reason }),
      );
    }
    await this.toast(this.translate.instant('milk.pauseCancelled'));
    await this.load();
  }

  protected async openPauseEditor(pause?: MilkPause, initialDate?: string): Promise<void> {
    const modal = await this.modals.create({
      component: MilkPauseEditorComponent,
      componentProps: { pause, initialDate },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveMilkPauseRequest>();
    if (role !== 'save' || !data) return;

    await firstValueFrom(pause ? this.milk.updatePause(pause.id, data) : this.milk.createPause(data));
    await this.toast(this.translate.instant(pause ? 'milk.pauseUpdated' : 'milk.deliveryPausedToast'));
    await this.load();
  }

  protected async cancelPause(pause: MilkPause): Promise<void> {
    if (!(await this.confirmDelete(this.translate.instant('milk.cancelPauseConfirm')))) return;
    await firstValueFrom(this.milk.deletePause(pause.id));
    await this.toast(this.translate.instant('milk.pauseCancelled'));
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

    const message =
      created.length === 1
        ? this.translate.instant('milk.extraRequestedOne')
        : this.translate.instant('milk.extraRequestedMany', { count: created.length });
    const toast = await this.toasts.create({
      message,
      duration: 4000,
      position: 'bottom',
      buttons:
        created.length === 1 && this.contact()
          ? [{ icon: 'logo-whatsapp', text: this.translate.instant('milk.notify'), handler: () => this.notifyExtra(created[0]) }]
          : [],
    });
    await toast.present();
  }

  protected async cancelExtra(extra: MilkExtraRequestItem): Promise<void> {
    if (!(await this.confirmDelete(this.translate.instant('milk.removeExtraConfirm')))) return;
    await firstValueFrom(this.milk.deleteExtraRequest(extra.id));
    await this.toast(this.translate.instant('milk.extraCancelled'));
    await this.load();
  }

  protected async openQuantityChangeEditor(change?: MilkQuantityChange, initialDate?: string): Promise<void> {
    const modal = await this.modals.create({
      component: MilkQuantityChangeEditorComponent,
      componentProps: { change, subscription: this.subscription(), initialDate },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveMilkQuantityChangeRequest>();
    if (role !== 'save' || !data) return;

    await firstValueFrom(change ? this.milk.updateQuantityChange(change.id, data) : this.milk.createQuantityChange(data));
    await this.toast(this.translate.instant(change ? 'milk.quantityChangeUpdated' : 'milk.quantityChangeScheduled'));
    await this.load();
  }

  protected async cancelQuantityChange(change: MilkQuantityChange): Promise<void> {
    if (!(await this.confirmDelete(this.translate.instant('milk.cancelQuantityChangeConfirm')))) return;
    await firstValueFrom(this.milk.deleteQuantityChange(change.id));
    await this.toast(this.translate.instant('milk.quantityChangeCancelled'));
    await this.load();
  }

  protected async openAddSheet(): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: this.translate.instant('milk.addToSchedule'),
      buttons: [
        { text: this.translate.instant('milk.requestExtraMilk'), icon: 'add-outline', handler: () => void this.openExtraEditor() },
        { text: this.translate.instant('milk.changeQuantity'), icon: 'create-outline', handler: () => void this.openQuantityChangeEditor() },
        {
          text: this.translate.instant(this.isSelfCollected() ? 'milk.pausePickup' : 'milk.pauseDelivery'),
          icon: 'pause-outline',
          handler: () => void this.router.navigateByUrl('/milk-pause'),
        },
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
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
      await this.toast(this.translate.instant('milk.toastServerError'), 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alerts.create({
      header: this.translate.instant('milk.deleteConfirmTitle'),
      message,
      buttons: [
        { text: this.translate.instant('milk.cancelBtn'), role: 'cancel' },
        { text: this.translate.instant('milk.deleteBtn'), role: 'destructive' },
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
