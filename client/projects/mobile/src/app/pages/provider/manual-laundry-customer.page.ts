import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LaundryItemLine,
  ManualLaundryApi,
  ManualLaundryBatch,
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
import { callOutline, checkmarkDoneOutline, logoWhatsapp, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-manual-laundry-customer',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonIcon, IonSkeletonText],
  templateUrl: './manual-laundry-customer.page.html',
  styleUrl: './provider.page.scss',
})
export class ManualLaundryCustomerPage implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly providerCustomers = inject(ProviderCustomersApi);
  private readonly manualLaundry = inject(ManualLaundryApi);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly customerId = this.route.snapshot.paramMap.get('customerId') ?? '';

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly loading = signal(true);
  protected readonly customer = signal<ProviderManualCustomer | null>(null);
  protected readonly batches = signal<ManualLaundryBatch[]>([]);
  protected readonly hasActive = computed(() => this.batches().some((b) => b.status === 'Active'));
  protected readonly hasHistory = computed(() => this.batches().some((b) => b.status === 'PickedUp'));

  constructor() {
    addIcons({ callOutline, logoWhatsapp, checkmarkDoneOutline, trash });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected async newBatch(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'New batch',
      inputs: [
        { name: 'itemType', type: 'text', placeholder: 'item type (e.g. Shirt)' },
        { name: 'quantity', type: 'number', placeholder: 'quantity', min: 1 },
      ],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'save', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const quantity = Number(data?.values?.quantity);
    const itemType = (data?.values?.itemType as string)?.trim();
    if (role !== 'confirm' || !itemType || !quantity || quantity <= 0) return;

    const items: LaundryItemLine[] = [{ itemType, quantity }];
    await firstValueFrom(
      this.manualLaundry.create(this.customerId, { serviceType: 'WashAndIron', givenOn: toDateOnlyString(new Date()), items }),
    );
    await this.toast('batch created 🧺');
    await this.load();
  }

  protected async markPickedUp(batch: ManualLaundryBatch): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Mark picked up',
      inputs: [{ name: 'amount', type: 'number', placeholder: 'amount (₹, optional)', min: 0 }],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'confirm', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    if (role !== 'confirm') return;

    const amount = Number(data?.values?.amount) || null;
    await firstValueFrom(this.manualLaundry.markPickedUp(this.customerId, batch.id, { amount }));
    await this.toast('marked as picked up ✅');
    await this.load();
  }

  protected async togglePaid(batch: ManualLaundryBatch): Promise<void> {
    await firstValueFrom(this.manualLaundry.setPaid(this.customerId, batch.id, { isPaid: !batch.isPaid }));
    await this.load();
  }

  protected async remove(batch: ManualLaundryBatch): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Delete this batch?',
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'delete', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onWillDismiss();
    if (role !== 'destructive') return;

    await firstValueFrom(this.manualLaundry.delete(this.customerId, batch.id));
    await this.toast('batch removed');
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
    shareOnWhatsApp(c.phone, `Hi ${c.name}, do you have any laundry ready for pickup today? 🧺`);
  }

  protected telLink(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  protected itemsSummary(batch: ManualLaundryBatch): string {
    const total = batch.items.reduce((sum, i) => sum + i.quantity, 0);
    return `${total} item${total === 1 ? '' : 's'}`;
  }

  protected itemsBreakdown(batch: ManualLaundryBatch): string {
    return batch.items.map((i) => `${i.itemType} ×${i.quantity}`).join(', ');
  }

  private async load(): Promise<void> {
    if (!this.customerId) return;

    this.loading.set(true);
    try {
      const [customers, batches] = await Promise.all([
        firstValueFrom(this.providerCustomers.list()),
        firstValueFrom(this.manualLaundry.list(this.customerId)),
      ]);
      const customer = customers.find((c) => c.id === this.customerId) ?? null;
      if (!customer) {
        await this.router.navigateByUrl('/provider/laundry', { replaceUrl: true });
        return;
      }
      this.customer.set(customer);
      this.batches.set(batches);
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
