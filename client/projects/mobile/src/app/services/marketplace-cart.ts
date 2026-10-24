import { Injectable, computed, signal } from '@angular/core';
import { MARKETPLACE_CATALOG, MarketplaceCatalogItem, QuotationItemLine } from '@gurtundaa/shared';

const ITEMS_BY_KEY = new Map<string, MarketplaceCatalogItem>(
  MARKETPLACE_CATALOG.flatMap((category) => category.items.map((item) => [item.key, item] as const)),
);

interface CartEntry {
  qty: number;
  pack: string;
  brand: string | null;
}

@Injectable({ providedIn: 'root' })
export class MarketplaceCart {
  private readonly entries = signal<Map<string, CartEntry>>(new Map());

  readonly totalItems = computed(() => this.entries().size);
  readonly totalQty = computed(() => [...this.entries().values()].reduce((sum, e) => sum + e.qty, 0));

  readonly lines = computed<QuotationItemLine[]>(() =>
    [...this.entries().entries()]
      .map((entry): QuotationItemLine | null => {
        const [key, { qty, pack, brand }] = entry;
        const item = ITEMS_BY_KEY.get(key);
        return item ? { itemKey: item.key, name: item.name, qty, pack, brand } : null;
      })
      .filter((line): line is QuotationItemLine => line !== null),
  );

  quantityOf(itemKey: string): number {
    return this.entries().get(itemKey)?.qty ?? 0;
  }

  packOf(itemKey: string): string {
    return this.entries().get(itemKey)?.pack ?? ITEMS_BY_KEY.get(itemKey)?.pack ?? '';
  }

  brandOf(itemKey: string): string | null {
    return this.entries().get(itemKey)?.brand ?? null;
  }

  setBrand(itemKey: string, brand: string | null): void {
    const entry = this.entries().get(itemKey);
    if (!entry) return;
    this.entries.update((current) => new Map(current).set(itemKey, { ...entry, brand }));
  }

  packOptionsOf(itemKey: string): string[] {
    return ITEMS_BY_KEY.get(itemKey)?.packOptions ?? [];
  }

  unitFamilyOf(itemKey: string): 'weight' | 'volume' | null {
    return ITEMS_BY_KEY.get(itemKey)?.unitFamily ?? null;
  }

  /** True when this item has real weight/volume size options (g/kg/ml/L) instead of a single fixed pack. */
  isScalable(itemKey: string): boolean {
    return this.packOptionsOf(itemKey).length > 1;
  }

  /** True when the currently selected pack is a typed-in custom quantity, not one of the preset chips. */
  isCustomPack(itemKey: string): boolean {
    const entry = this.entries().get(itemKey);
    return !!entry && !this.packOptionsOf(itemKey).includes(entry.pack);
  }

  /** Plain +/- count of the item's fixed pack — used for piece/bunch-style items. */
  add(itemKey: string): void {
    this.setQuantity(itemKey, this.quantityOf(itemKey) + 1);
  }

  setQuantity(itemKey: string, qty: number): void {
    const entry = this.entries().get(itemKey);
    this.setEntry(itemKey, qty, entry?.pack ?? ITEMS_BY_KEY.get(itemKey)?.pack ?? '', entry?.brand ?? null);
  }

  /** Picks an absolute size (e.g. "1 kg") for a scalable item — tapping the already-selected size removes it. */
  selectPack(itemKey: string, pack: string): void {
    const current = this.entries().get(itemKey);
    if (current && current.pack === pack) {
      this.setEntry(itemKey, 0, '', null);
    } else {
      this.setEntry(itemKey, 1, pack, current?.brand ?? null);
    }
  }

  /** Sets a user-typed custom quantity (e.g. "1.5 kg") — always applies, no toggle-off like `selectPack`. */
  setCustomPack(itemKey: string, pack: string): void {
    this.setEntry(itemKey, 1, pack, this.entries().get(itemKey)?.brand ?? null);
  }

  remove(itemKey: string): void {
    this.setEntry(itemKey, 0, '', null);
  }

  /** Reorder: adds a past request's items to whatever's already in the cart (summing qty on overlap),
   * so the customer can freely tweak quantities/items before sending it out again. Unknown/discontinued
   * catalog items are silently skipped since there'd be nothing to look up pack options etc. for. */
  addFromLines(lines: QuotationItemLine[]): void {
    this.entries.update((current) => {
      const next = new Map(current);
      for (const line of lines) {
        if (!ITEMS_BY_KEY.has(line.itemKey)) continue;
        const existing = next.get(line.itemKey);
        next.set(line.itemKey, { qty: (existing?.qty ?? 0) + line.qty, pack: line.pack, brand: existing?.brand ?? line.brand ?? null });
      }
      return next;
    });
  }

  clear(): void {
    this.entries.set(new Map());
  }

  private setEntry(itemKey: string, qty: number, pack: string, brand: string | null): void {
    this.entries.update((current) => {
      const next = new Map(current);
      if (qty <= 0) {
        next.delete(itemKey);
      } else {
        next.set(itemKey, { qty, pack, brand });
      }
      return next;
    });
  }
}
