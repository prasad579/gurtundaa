import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BillData,
  BillLineItem,
  LAUNDRY_SERVICE_TYPE_LABELS,
  LaundryApi,
  LaundryBatch,
  LaundryItemLine,
  LaundryServiceType,
  ServiceContact,
  ServiceContactsApi,
  formatWhatsAppBill,
  parseDateOnly,
  rupeeLabel,
  rupeesInWords,
  shareOnWhatsApp,
  shortDateLabel,
  waLink,
} from '@gurtundaa/shared';
import {
  ActionSheetController,
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
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
  alarmOutline,
  callOutline,
  checkmarkDoneOutline,
  chevronBack,
  chevronForward,
  close,
  locationOutline,
  logoWhatsapp,
  pencil,
  peopleOutline,
  shareSocialOutline,
  shirtOutline,
  timeOutline,
  trash,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { LaundryNotifications } from '../../services/laundry-notifications';
import { shareText } from '../../services/share';
import { LaundryEntryEditorComponent } from './laundry-entry-editor.component';
import { LaundryPickupComponent } from './laundry-pickup.component';

@Component({
  selector: 'app-laundry',
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
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonNote,
    IonSkeletonText,
  ],
  templateUrl: './laundry.page.html',
  styleUrl: './laundry.page.scss',
})
export class LaundryPage implements ViewWillEnter {
  private readonly laundry = inject(LaundryApi);
  private readonly contactsApi = inject(ServiceContactsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly alerts = inject(AlertController);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly notifications = inject(LaundryNotifications);

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly serviceTypeLabels = LAUNDRY_SERVICE_TYPE_LABELS;

  protected readonly loading = signal(true);
  protected readonly contacts = signal<ServiceContact[]>([]);
  protected readonly active = signal<LaundryBatch[]>([]);
  protected readonly history = signal<LaundryBatch[]>([]);

  private readonly monthDate = signal(new Date());
  protected readonly monthLabel = computed(() =>
    this.monthDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );

  private readonly batchesInMonth = computed(() => {
    const m = this.monthDate();
    return [...this.active(), ...this.history()].filter((b) => {
      const given = parseDateOnly(b.givenOn);
      return given.getFullYear() === m.getFullYear() && given.getMonth() === m.getMonth();
    });
  });

  protected readonly categoryTotals = computed(() => {
    const totals = new Map<LaundryServiceType, number>();
    for (const b of this.batchesInMonth()) {
      const amount = this.batchAmount(b);
      if (!amount) continue;
      totals.set(b.serviceType, (totals.get(b.serviceType) ?? 0) + amount);
    }
    return [...totals.entries()].map(([serviceType, amount]) => ({ serviceType, amount }));
  });

  protected readonly monthPaymentSummary = computed(() => {
    let paid = 0;
    let pending = 0;
    for (const b of this.batchesInMonth()) {
      const amount = this.batchAmount(b);
      if (!amount) continue;
      if (b.isPaid) paid += amount;
      else pending += amount;
    }
    return { paid, pending, total: paid + pending };
  });

  protected readonly monthEntries = computed(() => this.batchesInMonth().length);
  protected readonly monthTotalItems = computed(() =>
    this.batchesInMonth().reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0),
  );
  protected readonly monthPickedUp = computed(() => this.batchesInMonth().filter((b) => b.status === 'PickedUp').length);
  protected readonly monthWithDhobi = computed(() => this.batchesInMonth().filter((b) => b.status === 'Active').length);

  protected readonly primaryContact = computed(() => this.contacts().find((c) => c.isDefault) ?? this.contacts()[0] ?? null);

  protected readonly withDhobiQty = computed(() =>
    this.active().reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0),
  );

  private readonly sortedByReturn = computed(() =>
    [...this.active()].filter((b) => b.expectedReturn).sort((a, b) => a.expectedReturn!.localeCompare(b.expectedReturn!)),
  );

  protected readonly nextPickupBatch = computed(() => this.sortedByReturn()[0] ?? null);

  protected readonly specialReminders = computed(() => {
    const entries: { batch: LaundryBatch; item: LaundryItemLine }[] = [];
    for (const b of this.active()) {
      for (const item of b.items) {
        if (item.neededBy) entries.push({ batch: b, item });
      }
    }
    return entries.sort((a, b) => a.item.neededBy!.localeCompare(b.item.neededBy!));
  });

  constructor() {
    addIcons({
      add,
      callOutline,
      logoWhatsapp,
      pencil,
      trash,
      checkmarkDoneOutline,
      shirtOutline,
      peopleOutline,
      chevronBack,
      chevronForward,
      close,
      shareSocialOutline,
      locationOutline,
      alarmOutline,
      timeOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected readonly waLink = waLink;

  protected telLink(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  protected changeMonth(delta: number): void {
    const d = this.monthDate();
    this.monthDate.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  protected itemsCount(batch: LaundryBatch): number {
    return batch.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  protected itemsSummary(batch: LaundryBatch): string {
    const total = batch.items.reduce((sum, i) => sum + i.quantity, 0);
    return `${total} item${total === 1 ? '' : 's'} · ${batch.items.map((i) => `${i.itemType} (${i.quantity})`).join(', ')}`;
  }

  protected priceBreakdown(batch: LaundryBatch): string | null {
    const priced = batch.items.filter((i) => i.pricePerItem);
    if (priced.length === 0) return null;
    return priced.map((i) => `${i.itemType} × ${rupeeLabel(i.pricePerItem!)}`).join(', ');
  }

  // Active batches don't have a final `amount` until pickup, but if the dhobi already quoted
  // per-item prices at drop-off, we can show the running estimate from those.
  protected batchAmount(batch: LaundryBatch): number | null {
    if (batch.amount) return batch.amount;
    const estimated = batch.items.reduce((sum, i) => sum + i.quantity * (i.pricePerItem ?? 0), 0);
    return estimated > 0 ? estimated : null;
  }

  protected async openEntryEditor(batch?: LaundryBatch, sliding?: IonItemSliding): Promise<void> {
    await sliding?.close();
    const modal = await this.modals.create({
      component: LaundryEntryEditorComponent,
      componentProps: { batch, contacts: this.contacts() },
      breakpoints: [0, 0.95, 1],
      initialBreakpoint: 0.95,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    await firstValueFrom(batch ? this.laundry.update(batch.id, data) : this.laundry.create(data));
    await this.toast(batch ? 'entry updated' : 'laundry entry saved 🧺');
    await this.load();
  }

  protected async markPickedUp(batch: LaundryBatch, sliding?: IonItemSliding): Promise<void> {
    await sliding?.close();
    const modal = await this.modals.create({
      component: LaundryPickupComponent,
      componentProps: { batch },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    await firstValueFrom(this.laundry.markPickedUp(batch.id, data));
    await this.toast('marked as picked up ✅');
    await this.load();
  }

  protected async setPaid(batch: LaundryBatch, isPaid: boolean, sliding?: IonItemSliding): Promise<void> {
    await sliding?.close();
    await firstValueFrom(this.laundry.setPaid(batch.id, { isPaid }));
    await this.toast(isPaid ? 'marked as paid ✅' : 'marked as pending');
    await this.load();
  }

  protected async markAllPaidThisMonth(): Promise<void> {
    const pending = this.batchesInMonth().filter((b) => !b.isPaid && this.batchAmount(b));
    if (pending.length === 0) return;
    await Promise.all(pending.map((b) => firstValueFrom(this.laundry.setPaid(b.id, { isPaid: true }))));
    await this.toast('marked as paid ✅');
    await this.load();
  }

  protected daysUntil(dateOnly: string): number {
    const target = parseDateOnly(dateOnly);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
  }

  protected daysUntilLabel(dateOnly: string): string {
    const days = this.daysUntil(dateOnly);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
    return `In ${days} days`;
  }

  protected notifyPickup(batch: LaundryBatch): void {
    if (!batch.contactPhone) return;
    const qty = batch.items.reduce((sum, i) => sum + i.quantity, 0);
    shareOnWhatsApp(
      batch.contactPhone,
      `Hi, checking on my laundry (${qty} item${qty === 1 ? '' : 's'}, given ${shortDateLabel(batch.givenOn)}) — is it ready for pickup?`,
    );
  }

  protected shareBill(batch: LaundryBatch): void {
    if (!batch.contactPhone) return;
    shareOnWhatsApp(batch.contactPhone, formatWhatsAppBill(this.buildLaundryBill(batch)));
  }

  protected async openShareSheet(batch: LaundryBatch): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'Share bill',
      buttons: [
        ...(batch.contactPhone
          ? [{ text: 'Share via WhatsApp', icon: 'logo-whatsapp', handler: () => this.shareBill(batch) }]
          : []),
        { text: 'Share with others', icon: 'share-social-outline', handler: () => void this.shareBillWithOthers(batch) },
        { text: 'cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected async shareBillWithOthers(batch: LaundryBatch): Promise<void> {
    const bill = this.buildLaundryBill(batch);
    await shareText(formatWhatsAppBill(bill), bill.title);
  }

  private buildLaundryBill(batch: LaundryBatch): BillData {
    const amount = this.batchAmount(batch);
    const items: BillLineItem[] = batch.items.map((i) => ({
      label: i.itemType,
      qty: String(i.quantity),
      rate: i.pricePerItem ? rupeeLabel(i.pricePerItem) : '',
      amount: i.pricePerItem ? rupeeLabel(i.pricePerItem * i.quantity) : '',
    }));
    const totalItems = batch.items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      icon: '🧺',
      title: 'Laundry Bill',
      subtitleLines: [`📅 ${shortDateLabel(batch.givenOn)}`, this.serviceTypeLabels[batch.serviceType]],
      items,
      quantitySummary: { label: 'Total Items', value: String(totalItems) },
      total: amount
        ? { label: 'Total Amount', amount: rupeeLabel(amount), isPaid: batch.isPaid, amountInWords: rupeesInWords(amount) }
        : undefined,
      closingLine: 'Thank you! 🙏',
    };
  }

  protected async remove(batch: LaundryBatch, sliding?: IonItemSliding): Promise<void> {
    await sliding?.close();
    if (!(await this.confirmDelete('Delete this laundry entry?'))) return;
    await firstValueFrom(this.laundry.delete(batch.id));
    await this.toast('entry removed');
    await this.load();
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [contacts, active, history] = await Promise.all([
        firstValueFrom(this.contactsApi.list('Laundry')),
        firstValueFrom(this.laundry.list('Active')),
        firstValueFrom(this.laundry.list('PickedUp')),
      ]);
      this.contacts.set(contacts);
      this.active.set(active);
      this.history.set(history);
      void this.notifications.sync(active);
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
