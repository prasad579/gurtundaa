import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  MilkApi,
  MilkPause,
  ServiceContact,
  ServiceContactsApi,
  pauseRangeLabel,
  shortDateLabel,
  toDateOnlyString,
} from '@gurtundaa/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, logoWhatsapp, pauseOutline, playOutline, refreshOutline, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { MilkPauseEditorComponent } from './milk-pause-editor.component';

const REASONS = ['Out of Station', 'Guests', 'Festival', 'Other'];

@Component({
  selector: 'app-milk-pause',
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
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonInput,
    IonCheckbox,
  ],
  templateUrl: './milk-pause.page.html',
  styleUrl: './milk-pause.page.scss',
})
export class MilkPausePage implements ViewWillEnter {
  private readonly milk = inject(MilkApi);
  private readonly contactsApi = inject(ServiceContactsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly router = inject(Router);

  protected readonly pauseRangeLabel = pauseRangeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly reasons = REASONS;

  protected readonly loading = signal(true);
  protected readonly contact = signal<ServiceContact | null>(null);
  protected readonly pauses = signal<MilkPause[]>([]);

  protected readonly today = toDateOnlyString(new Date());
  protected readonly selectedReason = signal(REASONS[0]);
  protected readonly customReason = signal('');
  protected readonly startDate = signal(this.today);
  protected readonly endDate = signal(this.today);
  protected readonly notifyOnSave = signal(true);
  protected readonly saving = signal(false);

  protected readonly duration = computed(() => {
    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  });

  protected readonly activePause = computed(() => this.pauses().find((p) => this.statusOf(p) === 'active') ?? null);

  protected readonly history = computed(() =>
    [...this.pauses()].sort((a, b) => b.startDate.localeCompare(a.startDate)),
  );

  constructor() {
    addIcons({ pauseOutline, playOutline, refreshOutline, createOutline, trash, logoWhatsapp });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected statusOf(pause: MilkPause): 'active' | 'scheduled' | 'ended' {
    if (pause.endDate < this.today) return 'ended';
    if (pause.startDate <= this.today) return 'active';
    return 'scheduled';
  }

  protected durationOf(pause: MilkPause): number {
    const start = new Date(pause.startDate);
    const end = new Date(pause.endDate);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  }

  protected resumeDateLabel(pause: MilkPause): string {
    const end = new Date(pause.endDate);
    end.setDate(end.getDate() + 1);
    return shortDateLabel(toDateOnlyString(end));
  }

  protected selectReason(reason: string): void {
    this.selectedReason.set(reason);
  }

  protected onStartDateChange(value: string): void {
    const date = value.slice(0, 10);
    this.startDate.set(date);
    if (this.endDate() < date) {
      this.endDate.set(date);
    }
  }

  protected onEndDateChange(value: string): void {
    this.endDate.set(value.slice(0, 10));
  }

  protected notifyMilkman(pause: MilkPause): void {
    const c = this.contact();
    if (!c) return;
    const message =
      `Hi ${c.name}, just a heads up: milk delivery will be paused from ` +
      `${pause.startDate} to ${pause.endDate}${pause.reason ? ` (${pause.reason})` : ''}. Thank you!`;
    window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  }

  protected async editPause(pause: MilkPause): Promise<void> {
    const modal = await this.modals.create({
      component: MilkPauseEditorComponent,
      componentProps: { pause },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    await firstValueFrom(this.milk.updatePause(pause.id, data));
    await this.toast('pause updated');
    await this.load();
  }

  protected async cancelPause(pause: MilkPause): Promise<void> {
    await firstValueFrom(this.milk.deletePause(pause.id));
    await this.toast('pause cancelled');
    await this.load();
  }

  protected async submitNewPause(): Promise<void> {
    const reason = this.selectedReason() === 'Other' ? this.customReason().trim() : this.selectedReason();
    this.saving.set(true);
    try {
      const created = await firstValueFrom(
        this.milk.createPause({ startDate: this.startDate(), endDate: this.endDate(), reason: reason || null }),
      );
      if (this.notifyOnSave()) {
        this.notifyMilkman(created);
      }
      await this.toast('delivery paused 🧳');
      this.selectedReason.set(REASONS[0]);
      this.customReason.set('');
      this.startDate.set(this.today);
      this.endDate.set(this.today);
      await this.load();
    } finally {
      this.saving.set(false);
    }
  }

  protected async goToMilk(): Promise<void> {
    await this.router.navigateByUrl('/milk');
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [contacts, pauses] = await Promise.all([
        firstValueFrom(this.contactsApi.list('Milk')),
        firstValueFrom(this.milk.listPauses(false)),
      ]);
      this.contact.set(contacts[0] ?? null);
      this.pauses.set(pauses);
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
