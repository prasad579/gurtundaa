import { Component, computed, inject, signal } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  Bill,
  BRAND,
  DoseEntry,
  DoseLogApi,
  HouseholdApi,
  LaundryApi,
  LaundryBatch,
  Medicine,
  MedicinesApi,
  MilkApi,
  MilkPause,
  MilkToday,
  BillsApi,
  PRIORITY_LABELS,
  Reminder,
  ReminderFilter,
  ReminderStats,
  RemindersApi,
  SaveReminderRequest,
  billUrgency,
  dueLabel,
  emptyStateLine,
  greeting,
  isOverdue,
  randomCheer,
  rupeeLabel,
  shortDateLabel,
} from '@gurtundaa/shared';
import {
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
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
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, pencil, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ReminderNotifications } from '../../services/reminder-notifications';
import { ReminderEditorComponent } from './reminder-editor.component';

@Component({
  selector: 'app-reminders',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItemSliding,
    IonItem,
    IonItemOptions,
    IonItemOption,
    IonCheckbox,
    IonNote,
    IonFab,
    IonFabButton,
    IonSkeletonText,
  ],
  templateUrl: './reminders.page.html',
  styleUrl: './reminders.page.scss',
})
export class RemindersPage implements ViewWillEnter {
  private readonly api = inject(RemindersApi);
  private readonly auth = inject(AuthService);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly notifications = inject(ReminderNotifications);
  private readonly household = inject(HouseholdApi);
  private readonly milkApi = inject(MilkApi);
  private readonly laundryApi = inject(LaundryApi);
  private readonly billsApi = inject(BillsApi);
  private readonly medicinesApi = inject(MedicinesApi);
  private readonly doseLogApi = inject(DoseLogApi);

  protected readonly brand = BRAND;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly filter = signal<ReminderFilter>('Upcoming');
  protected readonly reminders = signal<Reminder[]>([]);
  protected readonly stats = signal<ReminderStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly hello = computed(() => greeting(this.auth.user()?.displayName));
  protected readonly emptyLine = computed(() => emptyStateLine(this.filter()));

  protected readonly dueLabel = dueLabel;
  protected readonly isOverdue = isOverdue;
  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;

  // ---------- Cross-module "what needs attention" cards ----------
  protected readonly milkToday = signal<MilkToday | null>(null);
  protected readonly milkPause = signal<MilkPause | null>(null);
  protected readonly laundryActive = signal<LaundryBatch[]>([]);
  protected readonly bills = signal<Bill[]>([]);
  protected readonly healthDoses = signal<DoseEntry[]>([]);
  protected readonly healthMedicines = signal<Medicine[]>([]);

  protected readonly milkMissedSlots = computed(() => {
    const t = this.milkToday();
    if (!t) return [];
    const missed: string[] = [];
    if (t.morning.enabled && t.morning.status === 'Missed') missed.push('Morning');
    if (t.evening.enabled && t.evening.status === 'Missed') missed.push('Evening');
    return missed;
  });

  protected readonly laundryNextPickup = computed(() =>
    [...this.laundryActive()]
      .filter((b) => b.expectedReturn)
      .sort((a, b) => a.expectedReturn!.localeCompare(b.expectedReturn!))[0] ?? null,
  );

  protected readonly billsNeedingAttention = computed(() =>
    this.bills().filter((b) => !b.isPaid && billUrgency(b.dueDate) !== 'Upcoming'),
  );
  protected readonly billsPendingAmount = computed(() =>
    this.billsNeedingAttention().reduce((sum, b) => sum + b.amount, 0),
  );

  protected readonly healthPendingCount = computed(() => this.healthDoses().filter((d) => d.status === null).length);
  protected readonly healthLowStock = computed(() =>
    this.healthMedicines().filter((m) => m.isActive && m.perDayQty > 0 && m.daysRemaining <= 2),
  );

  constructor() {
    addIcons({ add, pencil, trash });
  }

  ionViewWillEnter(): void {
    void this.load();
    void this.loadDashboard();
  }

  protected async setFilter(value: unknown): Promise<void> {
    this.filter.set(value as ReminderFilter);
    await this.load();
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  protected async openEditor(reminder?: Reminder, sliding?: IonItemSliding): Promise<void> {
    await sliding?.close();
    const modal = await this.modals.create({
      component: ReminderEditorComponent,
      componentProps: { reminder },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveReminderRequest>();
    if (role !== 'save' || !data) {
      return;
    }

    await firstValueFrom(reminder ? this.api.update(reminder.id, data) : this.api.create(data));
    await this.toast(reminder ? 'updated ✍️' : "saved. we'll remember 💭");
    await this.load();
  }

  protected async toggleDone(reminder: Reminder): Promise<void> {
    const done = !reminder.isDone;
    await firstValueFrom(this.api.setDone(reminder.id, done));
    if (done) {
      await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => undefined);
      await this.toast(randomCheer());
    }
    await this.load();
  }

  protected async remove(reminder: Reminder, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    await firstValueFrom(this.api.delete(reminder.id));
    await this.toast('gone 🫥');
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const filter = this.filter();
      const [list, stats, upcoming] = await Promise.all([
        firstValueFrom(this.api.list(filter)),
        firstValueFrom(this.api.stats()),
        // Notifications always follow the full upcoming list, whatever tab is showing.
        filter === 'Upcoming' ? Promise.resolve(null) : firstValueFrom(this.api.list('Upcoming')),
      ]);
      this.reminders.set(list);
      this.stats.set(stats);
      void this.notifications.sync(upcoming ?? list);
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  // Best-effort — a dashboard card failing to load shouldn't block the reminders list itself,
  // so each module's fetch is wrapped individually rather than one shared try/catch.
  private async loadDashboard(): Promise<void> {
    const profile = await firstValueFrom(this.household.get()).catch(() => null);
    const enabled = new Set(profile?.enabledFeatures ?? []);

    if (enabled.has('milk')) {
      firstValueFrom(this.milkApi.getToday())
        .then((t) => this.milkToday.set(t))
        .catch(() => undefined);
      firstValueFrom(this.milkApi.listPauses(true))
        .then((p) => this.milkPause.set(p[0] ?? null))
        .catch(() => undefined);
    }

    if (enabled.has('laundry')) {
      firstValueFrom(this.laundryApi.list('Active'))
        .then((b) => this.laundryActive.set(b))
        .catch(() => undefined);
    }

    if (enabled.has('bills')) {
      firstValueFrom(this.billsApi.list())
        .then((b) => this.bills.set(b))
        .catch(() => undefined);
    }

    if (enabled.has('medicines')) {
      firstValueFrom(this.medicinesApi.list())
        .then((m) => this.healthMedicines.set(m))
        .catch(() => undefined);
      firstValueFrom(this.doseLogApi.getToday())
        .then((d) => this.healthDoses.set(d))
        .catch(() => undefined);
    }
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
