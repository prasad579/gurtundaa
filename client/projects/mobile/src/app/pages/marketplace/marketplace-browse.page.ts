import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MARKETPLACE_CATALOG } from '@gurtundaa/shared';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cartOutline, remove } from 'ionicons/icons';
import { MarketplaceCart } from '../../services/marketplace-cart';
import { PackSizePickerComponent } from './pack-size-picker.component';

@Component({
  selector: 'app-marketplace-browse',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, PackSizePickerComponent],
  templateUrl: './marketplace-browse.page.html',
  styleUrl: './marketplace-browse.page.scss',
})
export class MarketplaceBrowsePage {
  private readonly router = inject(Router);
  protected readonly cart = inject(MarketplaceCart);

  protected readonly categories = MARKETPLACE_CATALOG;
  protected readonly selectedCategoryKey = signal(
    inject(ActivatedRoute).snapshot.paramMap.get('categoryKey') ?? this.categories[0].key,
  );
  protected readonly selectedCategory = computed(() =>
    this.categories.find((c) => c.key === this.selectedCategoryKey()),
  );

  constructor() {
    addIcons({ cartOutline, add, remove });
  }

  protected selectCategory(key: string): void {
    this.selectedCategoryKey.set(key);
  }

  protected openCart(): void {
    void this.router.navigateByUrl('/marketplace/cart');
  }
}
