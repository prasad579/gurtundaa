import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FulfillmentStatus,
  MarketplaceShopApi,
  Quote,
  formatWhatsAppQuote,
  rupeeLabel,
  shareOnWhatsApp,
  shareOnWhatsAppAny,
} from '@gurtundaa/shared';
import {
  ActionSheetController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoWhatsapp, shareSocialOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { shareText } from '../../../services/share';

const FULFILLMENT_STEPS: { value: FulfillmentStatus; label: string }[] = [
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Packing', label: 'Packing' },
  { value: 'OutForDelivery', label: 'Out' },
  { value: 'Delivered', label: 'Delivered' },
];

const NEXT_STATUS: Record<FulfillmentStatus, FulfillmentStatus | null> = {
  Accepted: 'Packing',
  Packing: 'OutForDelivery',
  OutForDelivery: 'Delivered',
  Delivered: null,
};

const NEXT_LABEL: Record<FulfillmentStatus, string> = {
  Accepted: 'Start Packing',
  Packing: 'Out for Delivery',
  OutForDelivery: 'Mark Delivered',
  Delivered: '',
};

@Component({
  selector: 'app-orders',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonButton,
    IonIcon,
    DatePipe,
  ],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrdersPage implements ViewWillEnter {
  private readonly shopApi = inject(MarketplaceShopApi);
  private readonly actionSheets = inject(ActionSheetController);

  constructor() {
    addIcons({ logoWhatsapp, shareSocialOutline });
  }

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly fulfillmentSteps = FULFILLMENT_STEPS;

  protected readonly loading = signal(true);
  protected readonly quotes = signal<Quote[]>([]);

  protected readonly activeOrders = computed(() =>
    this.quotes().filter((q) => q.status === 'Accepted' && q.fulfillmentStatus !== 'Delivered'),
  );
  protected readonly results = computed(() => this.quotes().filter((q) => q.status !== 'Accepted' || q.fulfillmentStatus === 'Delivered'));

  ionViewWillEnter(): void {
    void this.load();
  }

  protected stepIndex(status: Quote['fulfillmentStatus']): number {
    return status ? FULFILLMENT_STEPS.findIndex((s) => s.value === status) : -1;
  }

  protected nextLabel(status: Quote['fulfillmentStatus']): string {
    return status ? NEXT_LABEL[status] : '';
  }

  protected isPacked(quote: Quote, itemKey: string): boolean {
    return quote.packedItemKeys.includes(itemKey);
  }

  protected async togglePacked(quote: Quote, itemKey: string): Promise<void> {
    const updated = await firstValueFrom(this.shopApi.togglePackedItem(quote.id, { itemKey }));
    this.replaceQuote(updated);
  }

  protected async advance(quote: Quote): Promise<void> {
    const next = quote.fulfillmentStatus ? NEXT_STATUS[quote.fulfillmentStatus] : null;
    if (!next) return;
    const updated = await firstValueFrom(this.shopApi.advanceFulfillment(quote.id, { status: next }));
    this.replaceQuote(updated);
  }

  protected callCustomer(quote: Quote): void {
    if (quote.customerPhone) window.open(`tel:${quote.customerPhone}`, '_self');
  }

  protected whatsappCustomer(quote: Quote): void {
    if (quote.customerPhone) shareOnWhatsApp(quote.customerPhone, `Hi ${quote.customerName ?? ''}, your order with us is on the way!`.trim());
  }

  protected async openShareSheet(quote: Quote): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'Share your quote',
      buttons: [
        { text: 'Share via WhatsApp', icon: 'logo-whatsapp', handler: () => shareOnWhatsAppAny(this.buildShareText(quote)) },
        { text: 'Share with others', icon: 'share-social-outline', handler: () => void shareText(this.buildShareText(quote), 'My Quote') },
        { text: 'cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private buildShareText(quote: Quote): string {
    return formatWhatsAppQuote({
      shopName: quote.shopName,
      items: quote.items,
      deliveryChargeAmount: quote.deliveryChargeAmount,
      estimatedDeliveryMinutes: quote.estimatedDeliveryMinutes,
      validUntil: quote.validUntil,
      note: quote.note,
    });
  }

  protected resultLabel(quote: Quote): string {
    if (quote.status === 'Accepted') return quote.fulfillmentStatus === 'Delivered' ? 'Delivered' : 'Won';
    if (quote.status === 'Rejected') return 'Chose another shop';
    if (quote.status === 'Withdrawn') return 'Withdrawn';
    return 'Awaiting customer';
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private replaceQuote(updated: Quote): void {
    this.quotes.update((list) => list.map((q) => (q.id === updated.id ? updated : q)));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.quotes.set(await firstValueFrom(this.shopApi.listMine()));
    } finally {
      this.loading.set(false);
    }
  }
}
