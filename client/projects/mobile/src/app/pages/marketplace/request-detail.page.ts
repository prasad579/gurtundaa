import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthService,
  MARKETPLACE_CATALOG,
  MarketplaceApi,
  Quote,
  QuotationRequestDetail,
  countdownLabel,
  formatWhatsAppQuotationRequest,
  rupeeLabel,
  shareOnWhatsApp,
  shareOnWhatsAppAny,
} from '@gurtundaa/shared';
import {
  ActionSheetController,
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoWhatsapp, shareSocialOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { shareText } from '../../services/share';

const FULFILLMENT_STEPS: { value: string; label: string }[] = [
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Packing', label: 'Packing' },
  { value: 'OutForDelivery', label: 'Out' },
  { value: 'Delivered', label: 'Delivered' },
];

@Component({
  selector: 'app-request-detail',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
  ],
  templateUrl: './request-detail.page.html',
  styleUrl: './request-detail.page.scss',
})
export class RequestDetailPage implements ViewWillEnter {
  private readonly marketplace = inject(MarketplaceApi);
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly requestId = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  protected readonly rupeeLabel = rupeeLabel;

  protected readonly loading = signal(true);
  protected readonly detail = signal<QuotationRequestDetail | null>(null);
  protected readonly compareView = signal<'total' | 'item'>('total');
  protected readonly fulfillmentSteps = FULFILLMENT_STEPS;

  constructor() {
    addIcons({ logoWhatsapp, shareSocialOutline });
  }

  protected shopName(detail: QuotationRequestDetail, shopUserId: string): string {
    return detail.quotes.find((q: Quote) => q.shopUserId === shopUserId)?.shopName ?? 'a shop';
  }

  protected categoryMeta(categoryKey: string): { label: string; icon: string } {
    const category = MARKETPLACE_CATALOG.find((c) => c.key === categoryKey);
    return { label: category?.label ?? categoryKey, icon: category?.icon ?? '🛒' };
  }

  protected countdown(detail: QuotationRequestDetail): string | null {
    return countdownLabel(detail.quotesCloseAt);
  }

  // A mixed-category request can have one accepted quote per shop/category — a Submitted quote can
  // still be accepted unless some OTHER already-accepted quote covers at least one of its items.
  protected canAccept(detail: QuotationRequestDetail, quote: Quote): boolean {
    if (quote.status !== 'Submitted') return false;
    const myItemKeys = new Set(quote.items.map((i) => i.itemKey));
    return !detail.quotes.some((q) => q.status === 'Accepted' && q.items.some((i) => myItemKeys.has(i.itemKey)));
  }

  protected savingsLabel(detail: QuotationRequestDetail): string {
    const comparison = detail.comparison;
    if (!comparison) return '';
    const amounts = detail.quotes.map((q) => q.totalAmount).sort((a, b) => a - b);
    const nextBest = amounts.find((a) => a > comparison.cheapestTotalAmount) ?? amounts[1];
    const diff = (nextBest ?? comparison.cheapestTotalAmount) - comparison.cheapestTotalAmount;
    return diff > 0 ? `${rupeeLabel(comparison.cheapestTotalAmount)} total · ${rupeeLabel(diff)} less than the next best` : rupeeLabel(comparison.cheapestTotalAmount);
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected itemsSummary(detail: QuotationRequestDetail): string {
    return detail.items.map((i) => `${i.name}${i.brand ? ' [' + i.brand + ']' : ''} (${i.qty > 1 ? i.qty + ' × ' : ''}${i.pack})`).join(', ');
  }

  protected async openShareSheet(): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'Share your list',
      buttons: [
        { text: 'Share via WhatsApp', icon: 'logo-whatsapp', handler: () => this.shareOnWhatsApp() },
        { text: 'Share with others', icon: 'share-social-outline', handler: () => void this.shareWithOthers() },
        { text: 'cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected shareOnWhatsApp(): void {
    shareOnWhatsAppAny(this.buildShareText());
  }

  protected async shareWithOthers(): Promise<void> {
    await shareText(this.buildShareText(), 'Shopping List');
  }

  private buildShareText(): string {
    const detail = this.detail();
    return formatWhatsAppQuotationRequest({
      customerName: this.auth.user()?.displayName ?? 'a gurtundaa user',
      items: detail?.items ?? [],
      notes: detail?.notes,
    });
  }

  protected stepIndex(status: Quote['fulfillmentStatus']): number {
    return status ? FULFILLMENT_STEPS.findIndex((s) => s.value === status) : -1;
  }

  protected callShop(quote: Quote): void {
    if (quote.shopPhone) window.open(`tel:${quote.shopPhone}`, '_self');
  }

  protected whatsappShop(quote: Quote): void {
    if (quote.shopPhone) shareOnWhatsApp(quote.shopPhone, `Hi, following up on my order (${quote.shopName}) on gurtundaa.`);
  }

  protected async accept(quoteId: string): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Accept this quote?',
      message: 'The other quotes on this request will be marked as not accepted.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Accept', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onWillDismiss();
    if (role !== 'confirm') return;

    this.detail.set(await firstValueFrom(this.marketplace.accept(this.requestId, { quoteId })));
    await this.toast('quote accepted ✅');
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.detail.set(await firstValueFrom(this.marketplace.getDetail(this.requestId)));
    } finally {
      this.loading.set(false);
    }
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom' });
    await toast.present();
  }
}
