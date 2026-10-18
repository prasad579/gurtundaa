import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LAUNDRY_SERVICE_TYPE_LABELS,
  LaundryApi,
  LaundryBatch,
  LaundryServiceType,
  ServiceContact,
  ServiceContactsApi,
  rupeeLabel,
  shortDateLabel,
} from '@gurtundaa/shared';
import {
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
import { add, callOutline, checkmarkDoneOutline, logoWhatsapp, pencil, peopleOutline, shirtOutline, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
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

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly serviceTypeLabels = LAUNDRY_SERVICE_TYPE_LABELS;

  protected readonly loading = signal(true);
  protected readonly contacts = signal<ServiceContact[]>([]);
  protected readonly active = signal<LaundryBatch[]>([]);
  protected readonly history = signal<LaundryBatch[]>([]);

  protected readonly categoryTotals = computed(() => {
    const totals = new Map<LaundryServiceType, number>();
    for (const b of [...this.active(), ...this.history()]) {
      const amount = this.batchAmount(b);
      if (!amount) continue;
      totals.set(b.serviceType, (totals.get(b.serviceType) ?? 0) + amount);
    }
    return [...totals.entries()].map(([serviceType, amount]) => ({ serviceType, amount }));
  });

  constructor() {
    addIcons({ add, callOutline, logoWhatsapp, pencil, trash, checkmarkDoneOutline, shirtOutline, peopleOutline });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected telLink(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  protected waLink(phone: string): string {
    return `https://wa.me/${phone.replace(/\D/g, '')}`;
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

  protected async markPickedUp(batch: LaundryBatch, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
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

  protected async remove(batch: LaundryBatch, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
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
