import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthService,
  MarketplaceApi,
  formatWhatsAppQuotationRequest,
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
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, logoWhatsapp, pricetagOutline, remove, shareSocialOutline, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { shareText } from '../../services/share';
import { MarketplaceCart } from '../../services/marketplace-cart';
import { PackSizePickerComponent } from './pack-size-picker.component';
import { RequestQuotationResult, RequestQuotationSheetComponent } from './request-quotation-sheet.component';

@Component({
  selector: 'app-marketplace-cart',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonButton, IonIcon, PackSizePickerComponent],
  templateUrl: './marketplace-cart.page.html',
  styleUrl: './marketplace-cart.page.scss',
})
export class MarketplaceCartPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly marketplace = inject(MarketplaceApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly alerts = inject(AlertController);

  protected readonly cart = inject(MarketplaceCart);

  constructor() {
    addIcons({ add, remove, trash, shareSocialOutline, logoWhatsapp, pricetagOutline });
  }

  protected async promptBrand(itemKey: string, itemName: string): Promise<void> {
    const alert = await this.alerts.create({
      header: `Brand for ${itemName}?`,
      message: 'Optional — lets the shop know what you prefer.',
      inputs: [{ name: 'brand', type: 'text', placeholder: 'e.g. Sunflower, Amul…', value: this.cart.brandOf(itemKey) ?? '' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Clear', role: 'destructive', handler: () => this.cart.setBrand(itemKey, null) },
        { text: 'Save', role: 'confirm', handler: (data) => this.cart.setBrand(itemKey, data.brand?.trim() || null) },
      ],
    });
    await alert.present();
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
    return formatWhatsAppQuotationRequest({
      customerName: this.auth.user()?.displayName ?? 'a gurtundaa user',
      items: this.cart.lines(),
    });
  }

  protected async openRequestSheet(): Promise<void> {
    const modal = await this.modals.create({
      component: RequestQuotationSheetComponent,
      componentProps: { items: this.cart.lines() },
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<RequestQuotationResult>();
    if (role !== 'save' || !data) return;

    await firstValueFrom(
      this.marketplace.submit({
        items: this.cart.lines(),
        notes: data.notes,
        shopUserIds: data.shopUserIds,
        quotesCloseAt: data.quotesCloseAt,
      }),
    );

    const customerName = this.auth.user()?.displayName ?? 'a gurtundaa user';
    for (const contact of data.whatsappContacts) {
      shareOnWhatsApp(
        contact.phone,
        formatWhatsAppQuotationRequest({
          customerName,
          items: this.cart.lines(),
          notes: data.notes,
        }),
      );
    }

    this.cart.clear();
    await this.toast('quotation requested 🛒');
    await this.router.navigateByUrl('/marketplace/requests', { replaceUrl: true });
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom' });
    await toast.present();
  }
}
