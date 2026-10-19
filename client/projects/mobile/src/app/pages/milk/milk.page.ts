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
  MilkQuantityChange,
  MilkSlot,
  MilkSlotState,
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
  rupeeLabel,
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
  trash,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
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

  protected readonly statusLabels = MILK_STATUS_LABELS;
  protected readonly slotLabels = MILK_SLOT_LABELS;
  protected readonly litresLabel = litresLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly pauseRangeLabel = pauseRangeLabel;
  protected readonly timeOfDayLabel = timeOfDayLabel;
  protected readonly rupeeLabel = rupeeLabel;

  protected readonly loading = signal(true);
  protected readonly subscription = signal<MilkSubscription | null>(null);
  protected readonly contact = signal<ServiceContact | null>(null);
  protected readonly today = signal<MilkToday | null>(null);
  protected readonly month = signal<MilkMonth | null>(null);
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
    const statusLabel = isPlanned ? 'Planned 📅' : this.statusLabels[day.status];

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
        lines.push(`${this.slotLabels[slotName]}: Missed`);
      } else {
        lines.push(`${this.slotLabels[slotName]}: ${slotIsPlanned ? 'Expected' : 'Delivered'} ${litresLabel(slot.quantityLtr)}`);
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
      : slotEntries.map(([slotName, slot]) => ({
          text: slot.status === 'Missed' ? `Mark ${slotName} Delivered` : `Mark ${slotName} Missed`,
          handler: () => void this.toggleDaySlot(day.date, slotName, slot.status),
        }));

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

    // Plain text, not HTML — Ionic's alert escapes the message by default, which is what we want
    // since `reason` is free-text the user typed; `white-space: pre-line` (global styles) turns
    // the \n's into real line breaks without needing any HTML at all.
    const alert = await this.alerts.create({
      header: shortDateLabel(day.date),
      subHeader: statusLabel,
      message: lines.join('\n'),
      cssClass: 'day-detail-alert',
      buttons: [...toggleButtons, ...notifyButtons, 'Close'],
    });
    await alert.present();
  }

  private async toggleDaySlot(date: string, slot: MilkSlot, currentStatus: MilkSlotState['status']): Promise<void> {
    const status = currentStatus === 'Missed' ? 'Delivered' : 'Missed';
    await firstValueFrom(this.milk.setDeliveryOverride(date, { slot, status, quantityLtr: null }));
    await this.toast(status === 'Missed' ? 'marked as not delivered' : 'marked as delivered ✅');
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

  protected shareSettlement(): void {
    const c = this.contact();
    const m = this.month();
    if (!c || !m) return;
    const s = m.summary;

    const items: BillLineItem[] = [
      { label: 'Regular', qty: litresLabel(s.regularLitres), rate: rupeeLabel(s.ratePerLtr), amount: rupeeLabel(s.regularAmount) },
    ];
    if (s.extraLitres > 0) {
      items.push({ label: 'Extra', qty: litresLabel(s.extraLitres), rate: rupeeLabel(s.ratePerLtr), amount: rupeeLabel(s.extraAmount) });
    }

    const bill: BillData = {
      icon: '🥛',
      title: `Milk Bill — ${this.monthLabel()}`,
      items,
      quantitySummary: { label: 'Total Liters', value: litresLabel(s.regularLitres + s.extraLitres) },
      total: { label: 'Total Amount', amount: rupeeLabel(s.totalAmount), isPaid: s.isPaid },
      closingLine: 'Thank you! 🙏',
    };
    shareOnWhatsApp(c.phone, formatWhatsAppBill(bill));
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
    const savedContact = await firstValueFrom(
      existingContact ? this.contacts.update(existingContact.id, data.contact) : this.contacts.create(data.contact),
    );
    await firstValueFrom(this.milk.saveSubscription({ ...data.subscription, contactId: savedContact.id }));
    await this.toast('milk subscription saved 🥛');
    await this.load();
  }

  protected async markNotDelivered(slot: MilkSlot): Promise<void> {
    const t = this.today();
    if (!t) return;
    await firstValueFrom(this.milk.setDeliveryOverride(t.date, { slot, status: 'Missed' }));
    await this.load();

    const toast = await this.toasts.create({
      message: 'marked as not delivered',
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

  protected async openExtraEditor(): Promise<void> {
    const modal = await this.modals.create({
      component: MilkExtraEditorComponent,
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    const created = await firstValueFrom(this.milk.createExtraRequest(data));
    await this.load();

    const toast = await this.toasts.create({
      message: 'extra milk requested 🥛',
      duration: 4000,
      position: 'bottom',
      buttons: this.contact() ? [{ icon: 'logo-whatsapp', text: 'Notify', handler: () => this.notifyExtra(created) }] : [],
    });
    await toast.present();
  }

  protected async cancelExtra(extra: MilkExtraRequestItem): Promise<void> {
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
        { text: 'Pause Delivery', icon: 'pause-outline', handler: () => void this.router.navigateByUrl('/milk-pause') },
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
    this.month.set(await firstValueFrom(this.milk.getMonth(d.getFullYear(), d.getMonth() + 1)));
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
        const [today, pauses, extras, allExtras, quantityChanges, activity] = await Promise.all([
          firstValueFrom(this.milk.getToday()),
          firstValueFrom(this.milk.listPauses(true)),
          firstValueFrom(this.milk.listExtraRequests(true)),
          firstValueFrom(this.milk.listExtraRequests(false)),
          firstValueFrom(this.milk.listQuantityChanges(true)),
          firstValueFrom(this.milk.getActivity(10)),
        ]);
        this.today.set(today);
        this.pauses.set(pauses);
        this.extras.set(extras);
        this.allExtras.set(allExtras);
        this.quantityChanges.set(quantityChanges);
        this.activity.set(activity);
        await this.loadMonth();
      }
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
