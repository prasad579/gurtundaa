import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  AuthService,
  BRAND,
  PRIORITY_LABELS,
  Reminder,
  ReminderFilter,
  ReminderStats,
  RemindersApi,
  SaveReminderRequest,
  dueLabel,
  emptyStateLine,
  greeting,
  isOverdue,
  randomCheer,
} from '@gurtundaa/shared';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
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
import { add, homeOutline, logOutOutline, pencil, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ReminderNotifications } from '../../services/reminder-notifications';
import { ReminderEditorComponent } from './reminder-editor.component';

@Component({
  selector: 'app-reminders',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
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
  private readonly router = inject(Router);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly sheets = inject(ActionSheetController);
  private readonly notifications = inject(ReminderNotifications);

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

  constructor() {
    addIcons({ add, logOutOutline, homeOutline, pencil, trash });
  }

  ionViewWillEnter(): void {
    void this.load();
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

  protected async openAccount(): Promise<void> {
    const sheet = await this.sheets.create({
      header: this.auth.user()?.email,
      buttons: [
        { text: 'household profile', icon: 'home-outline', data: 'profile' },
        { text: 'log out', role: 'destructive', icon: 'log-out-outline', data: 'logout' },
        { text: 'nvm', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data } = await sheet.onWillDismiss();
    if (data === 'logout') {
      await this.auth.logout();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } else if (data === 'profile') {
      await this.router.navigateByUrl('/profile');
    }
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

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
