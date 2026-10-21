import { Component, inject, signal } from '@angular/core';
import {
  IncomingQuotationRequest,
  MARKETPLACE_CATALOG,
  MarketplaceShopApi,
  Quote,
  countdownLabel,
  formatWhatsAppQuote,
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
  ModalController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoWhatsapp, shareSocialOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { shareText } from '../../../services/share';
import { SubmitQuoteSheetComponent } from './submit-quote-sheet.component';

@Component({
  selector: 'app-incoming-requests',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonSkeletonText, IonButton, IonIcon],
  templateUrl: './incoming-requests.page.html',
  styleUrl: './incoming-requests.page.scss',
})
export class IncomingRequestsPage implements ViewWillEnter {
  private readonly shopApi = inject(MarketplaceShopApi);
  private readonly modals = inject(ModalController);
  private readonly actionSheets = inject(ActionSheetController);

  protected readonly loading = signal(true);
  protected readonly requests = signal<IncomingQuotationRequest[]>([]);
  protected readonly myQuotesByRequestId = signal(new Map<string, Quote>());

  constructor() {
    addIcons({ logoWhatsapp, shareSocialOutline });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected itemsSummary(request: IncomingQuotationRequest): string {
    return request.items.map((i) => `${i.name} (${i.qty} × ${i.pack})`).join(', ');
  }

  protected categoryLabel(request: IncomingQuotationRequest): string | null {
    const keys = new Set(request.items.map((i) => i.itemKey.split(':')[0]));
    if (keys.size !== 1) return null;
    const category = MARKETPLACE_CATALOG.find((c) => c.key === [...keys][0]);
    return category ? `${category.icon} ${category.label}` : null;
  }

  protected dateLabel(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  protected countdown(request: IncomingQuotationRequest): string | null {
    return countdownLabel(request.quotesCloseAt);
  }

  protected myQuote(request: IncomingQuotationRequest): Quote | undefined {
    return this.myQuotesByRequestId().get(request.id);
  }

  protected async openShareSheet(request: IncomingQuotationRequest): Promise<void> {
    const quote = this.myQuote(request);
    if (!quote) return;

    const sheet = await this.actionSheets.create({
      header: 'Share your quote',
      buttons: [
        { text: 'Share via WhatsApp', icon: 'logo-whatsapp', handler: () => this.shareOnWhatsApp(quote) },
        { text: 'Share with others', icon: 'share-social-outline', handler: () => void this.shareWithOthers(quote) },
        { text: 'cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected shareOnWhatsApp(quote: Quote): void {
    shareOnWhatsAppAny(this.buildShareText(quote));
  }

  protected async shareWithOthers(quote: Quote): Promise<void> {
    await shareText(this.buildShareText(quote), 'My Quote');
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

  protected async openQuoteSheet(request: IncomingQuotationRequest): Promise<void> {
    const modal = await this.modals.create({
      component: SubmitQuoteSheetComponent,
      componentProps: { request },
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'save') {
      await this.load();
    }
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [requests, myQuotes] = await Promise.all([
        firstValueFrom(this.shopApi.listIncoming()),
        firstValueFrom(this.shopApi.listMine()),
      ]);
      this.requests.set(requests);
      this.myQuotesByRequestId.set(new Map(myQuotes.map((q) => [q.quotationRequestId, q])));
    } finally {
      this.loading.set(false);
    }
  }
}
