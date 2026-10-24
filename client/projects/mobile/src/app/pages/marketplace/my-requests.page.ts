import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthService,
  MarketplaceApi,
  QuotationRequest,
  formatWhatsAppQuotationRequest,
  rupeeLabel,
  shareOnWhatsAppAny,
} from '@gurtundaa/shared';
import {
  ActionSheetController,
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
import { logoWhatsapp, refreshOutline, shareSocialOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { MarketplaceCart } from '../../services/marketplace-cart';
import { shareText } from '../../services/share';

@Component({
  selector: 'app-my-requests',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
  ],
  templateUrl: './my-requests.page.html',
  styleUrl: './my-requests.page.scss',
})
export class MyRequestsPage implements ViewWillEnter {
  private readonly marketplace = inject(MarketplaceApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly cart = inject(MarketplaceCart);
  private readonly toasts = inject(ToastController);

  protected readonly rupeeLabel = rupeeLabel;

  protected readonly loading = signal(true);
  protected readonly requests = signal<QuotationRequest[]>([]);

  constructor() {
    addIcons({ logoWhatsapp, shareSocialOutline, refreshOutline });
  }

  protected async reorder(request: QuotationRequest): Promise<void> {
    this.cart.addFromLines(request.items);
    const toast = await this.toasts.create({ message: 'added to cart 🛒', duration: 1500, position: 'bottom' });
    await toast.present();
    await this.router.navigateByUrl('/marketplace/cart');
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected itemsSummary(request: QuotationRequest): string {
    return request.items.map((i) => `${i.name} (${i.qty > 1 ? i.qty + ' × ' : ''}${i.pack})`).join(', ');
  }

  protected async openShareSheet(request: QuotationRequest): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'Share your list',
      buttons: [
        { text: 'Share via WhatsApp', icon: 'logo-whatsapp', handler: () => this.shareOnWhatsApp(request) },
        { text: 'Share with others', icon: 'share-social-outline', handler: () => void this.shareWithOthers(request) },
        { text: 'cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected shareOnWhatsApp(request: QuotationRequest): void {
    shareOnWhatsAppAny(this.buildShareText(request));
  }

  protected async shareWithOthers(request: QuotationRequest): Promise<void> {
    await shareText(this.buildShareText(request), 'Shopping List');
  }

  private buildShareText(request: QuotationRequest): string {
    return formatWhatsAppQuotationRequest({
      customerName: this.auth.user()?.displayName ?? 'a gurtundaa user',
      items: request.items,
      notes: request.notes,
    });
  }

  protected dateLabel(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  protected openDetail(request: QuotationRequest): void {
    void this.router.navigateByUrl(`/marketplace/requests/${request.id}`);
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.requests.set(await firstValueFrom(this.marketplace.list()));
    } finally {
      this.loading.set(false);
    }
  }
}
