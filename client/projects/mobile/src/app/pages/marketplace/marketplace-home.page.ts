import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MARKETPLACE_CATALOG } from '@gurtundaa/shared';
import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cartOutline, listOutline } from 'ionicons/icons';
import { MarketplaceCart } from '../../services/marketplace-cart';

@Component({
  selector: 'app-marketplace-home',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon],
  templateUrl: './marketplace-home.page.html',
  styleUrl: './marketplace-home.page.scss',
})
export class MarketplaceHomePage {
  private readonly router = inject(Router);
  protected readonly cart = inject(MarketplaceCart);

  // "medical" has no browsable items — it's reached only via the Health module's
  // "request from a pharmacy" shortcut, so it's excluded from the general category grid.
  protected readonly categories = MARKETPLACE_CATALOG.filter((c) => c.key !== 'medical');

  constructor() {
    addIcons({ cartOutline, listOutline });
  }

  protected openCategory(categoryKey: string): void {
    void this.router.navigateByUrl(`/marketplace/category/${categoryKey}`);
  }

  protected openCart(): void {
    void this.router.navigateByUrl('/marketplace/cart');
  }

  protected openMyRequests(): void {
    void this.router.navigateByUrl('/marketplace/requests');
  }
}
