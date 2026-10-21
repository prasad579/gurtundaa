import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MARKETPLACE_CATALOG, PriceListEntry, ShopPriceListApi, ShopProfileApi, rupeeLabel } from '@gurtundaa/shared';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

const STALE_DAYS = 14;
const FRESH_DAYS = 7;

interface CatalogMeta {
  name: string;
  pack: string;
}

@Component({
  selector: 'app-price-list',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSelect, IonSelectOption, IonInput, IonButton],
  templateUrl: './price-list.page.html',
  styleUrl: './price-list.page.scss',
})
export class PriceListPage implements ViewWillEnter {
  private readonly priceListApi = inject(ShopPriceListApi);
  private readonly shopProfileApi = inject(ShopProfileApi);
  private readonly toasts = inject(ToastController);
  private readonly catalogMeta = new Map<string, CatalogMeta>(
    MARKETPLACE_CATALOG.flatMap((c) => c.items.map((i) => [i.key, { name: i.name, pack: i.pack }] as const)),
  );

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly loading = signal(true);
  protected readonly entries = signal<PriceListEntry[]>([]);
  protected readonly filter = signal<'all' | 'old'>('all');
  protected readonly servedCategoryKeys = signal<string[]>([]);

  protected readonly addForm = new FormGroup({
    itemKey: new FormControl('', { nonNullable: true }),
    unitPrice: new FormControl(0, { nonNullable: true }),
  });

  protected readonly stats = computed(() => {
    const now = Date.now();
    const list = this.entries();
    return {
      items: list.length,
      fresh: list.filter((e) => now - new Date(e.updatedAt).getTime() < FRESH_DAYS * 86_400_000).length,
      stale: list.filter((e) => now - new Date(e.updatedAt).getTime() >= STALE_DAYS * 86_400_000).length,
    };
  });

  protected readonly filtered = computed(() => {
    const list = this.entries();
    if (this.filter() !== 'old') return list;
    const now = Date.now();
    return list.filter((e) => now - new Date(e.updatedAt).getTime() >= STALE_DAYS * 86_400_000);
  });

  // Catalog items within the shop's served categories that don't have a price yet.
  protected readonly unpricedOptions = computed(() => {
    const pricedKeys = new Set(this.entries().map((e) => e.itemKey));
    const myCategories = new Set(this.servedCategoryKeys());
    return MARKETPLACE_CATALOG.filter((c) => myCategories.has(c.key))
      .flatMap((c) => c.items)
      .filter((i) => !pricedKeys.has(i.key));
  });

  ionViewWillEnter(): void {
    void this.load();
  }

  protected itemName(itemKey: string): string {
    return this.catalogMeta.get(itemKey)?.name ?? itemKey;
  }

  protected itemPack(itemKey: string): string {
    return this.catalogMeta.get(itemKey)?.pack ?? '';
  }

  protected isStale(entry: PriceListEntry): boolean {
    return Date.now() - new Date(entry.updatedAt).getTime() >= STALE_DAYS * 86_400_000;
  }

  protected dateLabel(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  protected async addPrice(): Promise<void> {
    const { itemKey, unitPrice } = this.addForm.getRawValue();
    if (!itemKey || unitPrice <= 0) return;

    const updated = await firstValueFrom(this.priceListApi.save({ items: [{ itemKey, unitPrice }] }));
    this.entries.set(updated);
    this.addForm.reset({ itemKey: '', unitPrice: 0 });
    await this.toast('price saved ✅');
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [entries, profile] = await Promise.all([
        firstValueFrom(this.priceListApi.get()),
        firstValueFrom(this.shopProfileApi.get()),
      ]);
      this.entries.set(entries);
      this.servedCategoryKeys.set(profile?.servedCategoryKeys ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom' });
    await toast.present();
  }
}
