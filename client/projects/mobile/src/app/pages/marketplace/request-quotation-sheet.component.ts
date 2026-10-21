import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MARKETPLACE_CATALOG,
  MarketplaceApi,
  QuotationItemLine,
  ServiceContact,
  ServiceContactsApi,
  ShopSummary,
} from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

export interface RequestQuotationResult {
  shopUserIds: string[];
  whatsappContacts: ServiceContact[];
  notes: string | null;
  quotesCloseAt: string | null;
}

const CLOSE_WINDOW_PRESETS = [15, 30, 60];

interface CategoryGroup {
  key: string;
  label: string;
  icon: string;
  items: QuotationItemLine[];
  coveringShopNames: string[];
  anyShopCovers: boolean;
}

const CATEGORY_META = new Map(MARKETPLACE_CATALOG.map((c) => [c.key, { label: c.label, icon: c.icon }]));

@Component({
  selector: 'app-request-quotation-sheet',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonTextarea,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>request quotation</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="selectedCount() === 0" (click)="submit()">send</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (categoryGroups().length > 0) {
        <h3 class="section-title">Your cart → grouped by category</h3>
        @for (g of categoryGroups(); track g.key) {
          <div class="cart-cat">
            <div class="cc-hd"><span class="ic">{{ g.icon }}</span><span class="nm">{{ g.label }}</span><span class="cnt">{{ g.items.length }} item{{ g.items.length === 1 ? '' : 's' }}</span></div>
            <div class="cc-items">{{ itemsLabel(g) }}</div>
            @if (!g.anyShopCovers) {
              <div class="no-shop">No shop on gurtundaa sells this category yet — send via WhatsApp instead.</div>
            } @else if (g.coveringShopNames.length === 0) {
              <div class="no-shop">None of your selected shops cover this — pick one below.</div>
            } @else {
              <div class="shop-chip-row">
                @for (name of g.coveringShopNames; track name) {
                  <span class="shop-chip">✓ {{ name }}</span>
                }
              </div>
            }
          </div>
        }
      }

      @if (shops().length > 0) {
        <h3 class="section-title">Shops on gurtundaa</h3>
        <ion-list lines="full">
          @for (shop of shops(); track shop.userId) {
            <ion-item>
              <ion-checkbox
                slot="start"
                [checked]="selectedShopIds().has(shop.userId)"
                (ionChange)="toggleShop(shop.userId)"
              />
              <ion-label>
                <h2>{{ shop.shopName }}</h2>
                @if (shop.city) {
                  <p>{{ shop.city }}</p>
                }
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }

      @if (whatsappContacts().length > 0) {
        <h3 class="section-title">Shop contacts (via WhatsApp)</h3>
        <ion-list lines="full">
          @for (contact of whatsappContacts(); track contact.id) {
            <ion-item>
              <ion-checkbox
                slot="start"
                [checked]="selectedContactIds().has(contact.id)"
                (ionChange)="toggleContact(contact.id)"
              />
              <ion-label>
                <h2>{{ contact.name }}</h2>
                <p>{{ contact.phone }}</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }

      @if (shops().length === 0 && whatsappContacts().length === 0) {
        <p class="empty">
          No shops to send to yet. Add a shop contact from <strong>More → Contacts</strong>, or wait for shops to
          join gurtundaa.
        </p>
      }

      <h3 class="section-title">Quotes close in</h3>
      <div class="shop-chip-row">
        @for (mins of closeWindowPresets; track mins) {
          <button type="button" class="win-chip" [class.sel]="closeWindowMinutes() === mins" (click)="closeWindowMinutes.set(mins)">{{ mins }} min</button>
        }
        <button type="button" class="win-chip" [class.sel]="closeWindowMinutes() === null" (click)="closeWindowMinutes.set(null)">No limit</button>
      </div>

      <ion-list lines="none">
        <ion-item>
          <ion-textarea
            [formControl]="notes"
            label="notes (optional)"
            labelPlacement="stacked"
            placeholder="brand preference, delivery time…"
            [autoGrow]="true"
            [maxlength]="500"
          />
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: `
    .section-title {
      margin: 12px 4px 4px;
      font-size: 13px;
      font-weight: 800;
    }
    .empty {
      font-size: 13px;
      color: var(--ion-color-medium);
      margin: 16px 4px;
    }
    .cart-cat {
      border-radius: 11px;
      background: var(--ion-color-step-50, #f7f8fb);
      border: 1px solid var(--ion-color-step-100, #ece7f6);
      padding: 9px;
      margin: 0 4px 8px;
    }
    .cc-hd {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
      .ic { font-size: 15px; }
      .nm { font-size: 11.5px; font-weight: 700; flex: 1; }
      .cnt { font-size: 9.5px; color: var(--ion-color-medium); }
    }
    .cc-items {
      font-size: 10px;
      color: var(--ion-color-medium);
      margin-bottom: 7px;
      line-height: 1.5;
    }
    .shop-chip-row {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }
    .shop-chip {
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      background: rgb(67 160 71 / 0.12);
      color: #2e7d32;
    }
    .no-shop {
      font-size: 10.5px;
      color: #c62828;
      background: rgb(198 40 40 / 0.07);
      border: 1px dashed rgb(198 40 40 / 0.3);
      border-radius: 8px;
      padding: 6px 8px;
    }
    .win-chip {
      padding: 4px 11px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: var(--ion-color-step-50, #f0f2ff);
      border: 1px solid var(--ion-color-step-150, #c5cae9);
      color: var(--ion-color-primary, #4338ca);

      &.sel {
        background: var(--ion-color-primary, #4338ca);
        color: #fff;
        border-color: var(--ion-color-primary, #4338ca);
      }
    }
  `,
})
export class RequestQuotationSheetComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly marketplace = inject(MarketplaceApi);
  private readonly contactsApi = inject(ServiceContactsApi);

  @Input() items: QuotationItemLine[] = [];

  protected readonly shops = signal<ShopSummary[]>([]);
  protected readonly whatsappContacts = signal<ServiceContact[]>([]);
  protected readonly selectedShopIds = signal<ReadonlySet<string>>(new Set());
  protected readonly selectedContactIds = signal<ReadonlySet<string>>(new Set());
  protected readonly notes = new FormControl('', { nonNullable: true });
  protected readonly closeWindowPresets = CLOSE_WINDOW_PRESETS;
  protected readonly closeWindowMinutes = signal<number | null>(30);

  protected readonly selectedCount = signal(0);

  protected readonly categoryGroups = computed<CategoryGroup[]>(() => {
    const byCategory = new Map<string, QuotationItemLine[]>();
    for (const item of this.items) {
      const key = item.itemKey.split(':')[0];
      byCategory.set(key, [...(byCategory.get(key) ?? []), item]);
    }

    const selectedShops = this.shops().filter((s) => this.selectedShopIds().has(s.userId));
    return [...byCategory.entries()].map(([key, items]) => {
      const meta = CATEGORY_META.get(key);
      const allCovering = this.shops().filter((s) => s.servedCategoryKeys.includes(key));
      const selectedCovering = selectedShops.filter((s) => s.servedCategoryKeys.includes(key));
      return {
        key,
        label: meta?.label ?? key,
        icon: meta?.icon ?? '🛒',
        items,
        coveringShopNames: selectedCovering.map((s) => s.shopName),
        anyShopCovers: allCovering.length > 0,
      };
    });
  });

  async ngOnInit(): Promise<void> {
    const [shops, contacts] = await Promise.all([
      firstValueFrom(this.marketplace.listShops()),
      firstValueFrom(this.contactsApi.list('Shop')),
    ]);
    this.shops.set(shops);
    this.whatsappContacts.set(contacts);
  }

  protected itemsLabel(group: CategoryGroup): string {
    return group.items.map((i) => `${i.name} (${i.qty > 1 ? i.qty + ' × ' : ''}${i.pack})`).join(' · ');
  }

  protected toggleShop(id: string): void {
    this.selectedShopIds.update((current) => toggle(current, id));
    this.selectedCount.set(this.selectedShopIds().size + this.selectedContactIds().size);
  }

  protected toggleContact(id: string): void {
    this.selectedContactIds.update((current) => toggle(current, id));
    this.selectedCount.set(this.selectedShopIds().size + this.selectedContactIds().size);
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected submit(): Promise<boolean> {
    const mins = this.closeWindowMinutes();
    const result: RequestQuotationResult = {
      shopUserIds: [...this.selectedShopIds()],
      whatsappContacts: this.whatsappContacts().filter((c) => this.selectedContactIds().has(c.id)),
      notes: this.notes.value.trim() || null,
      quotesCloseAt: mins ? new Date(Date.now() + mins * 60 * 1000).toISOString() : null,
    };
    return this.modalCtrl.dismiss(result, 'save');
  }
}

function toggle<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}
