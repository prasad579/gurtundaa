import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IncomingQuotationRequest, MarketplaceShopApi, PriceListEntry, ShopPriceListApi, rupeeLabel } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

const ETA_PRESETS = [30, 45, 60, 90];
const VALID_PRESETS: { label: string; hours: number }[] = [
  { label: '1 hour', hours: 1 },
  { label: '3 hours', hours: 3 },
  { label: 'Today EOD', hours: 8 },
];

@Component({
  selector: 'app-submit-quote-sheet',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput, IonTextarea],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>submit quote</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="busy()" (click)="submit()">send</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="full">
        @for (item of request.items; track item.itemKey) {
          <ion-item>
            <ion-label>
              <h2>{{ item.name }}</h2>
              <p>{{ item.qty }} × {{ item.pack }}</p>
              @if (lastEntry(item.itemKey); as last) {
                <p class="prev">Last: {{ rupeeLabel(last.unitPrice) }} · {{ dateLabel(last.updatedAt) }}</p>
              }
              <p class="delta" [class]="deltaClass(item.itemKey)">{{ deltaLabel(item.itemKey) }}</p>
            </ion-label>
            <ion-input
              slot="end"
              type="number"
              inputmode="decimal"
              placeholder="price"
              style="max-width: 100px; text-align: right"
              [value]="prices.get(item.itemKey)?.value"
              (ionInput)="setPrice(item.itemKey, $event)"
            />
          </ion-item>
        }
      </ion-list>

      <div class="chg-bar">
        <span>{{ changeSummary() }}</span>
        @if (anyPreviousPrices()) {
          <span class="lnk" (click)="resetToLast()">Reset to last</span>
        }
      </div>

      <h3 class="section-title">Delivery</h3>
      <div class="chips">
        @for (opt of deliveryOptions; track opt.value) {
          <button type="button" class="chip" [class.sel]="deliveryCharge() === opt.value" (click)="setDeliveryCharge(opt.value)">{{ opt.label }}</button>
        }
      </div>

      <h3 class="section-title">Can deliver in</h3>
      <div class="chips">
        @for (mins of etaPresets; track mins) {
          <button type="button" class="chip" [class.sel]="etaMinutes() === mins" (click)="etaMinutes.set(mins)">{{ mins }} min</button>
        }
      </div>

      <h3 class="section-title">Quote valid for</h3>
      <div class="chips">
        @for (preset of validPresets; track preset.label) {
          <button type="button" class="chip" [class.sel]="validHours() === preset.hours" (click)="validHours.set(preset.hours)">{{ preset.label }}</button>
        }
      </div>

      <div class="total">Total: {{ rupeeLabel(totalAmount()) }}</div>

      <ion-list lines="none">
        <ion-item>
          <ion-textarea
            [formControl]="note"
            label="note (quality, brand…)"
            labelPlacement="stacked"
            [autoGrow]="true"
            [maxlength]="300"
          />
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: `
    .prev {
      font-size: 9.5px;
      color: var(--ion-color-medium);
    }
    .delta {
      font-size: 10px;
      font-weight: 700;
      &.same { color: #2e7d32; }
      &.up { color: #c62828; }
      &.dn { color: #1565c0; }
      &.new { color: #e65100; }
    }
    .chg-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--ion-color-step-50, #f7f8fb);
      border-radius: 8px;
      padding: 7px 9px;
      font-size: 11px;
      color: var(--ion-color-dark, #555);
      margin-top: 4px;

      b { color: var(--ion-color-dark, #111); }
      .lnk {
        margin-left: auto;
        color: var(--ion-color-primary, #4338ca);
        font-weight: 700;
        cursor: pointer;
      }
    }
    .section-title {
      margin: 14px 4px 6px;
      font-size: 12px;
      font-weight: 800;
    }
    .chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chip {
      background: var(--ion-color-step-50, #f0f2ff);
      border: 1px solid var(--ion-color-step-150, #c5cae9);
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ion-color-primary, #4338ca);

      &.sel {
        background: var(--ion-color-primary, #4338ca);
        color: #fff;
        border-color: var(--ion-color-primary, #4338ca);
      }
    }
    .total {
      text-align: right;
      font-weight: 800;
      font-size: 16px;
      margin: 16px 4px 4px;
      color: var(--ion-color-primary, #7c3aed);
    }
  `,
})
export class SubmitQuoteSheetComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly shopApi = inject(MarketplaceShopApi);
  private readonly priceListApi = inject(ShopPriceListApi);
  private readonly toasts = inject(ToastController);

  @Input({ required: true }) request!: IncomingQuotationRequest;

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly note = new FormControl('', { nonNullable: true });
  protected readonly prices = new Map<string, FormControl<number>>();
  protected readonly busy = signal(false);
  protected readonly totalAmount = signal(0);
  protected readonly priceList = signal(new Map<string, PriceListEntry>());
  // Bumped whenever a price input changes so computed() signals re-derive (FormControls aren't signals).
  private readonly priceTick = signal(0);

  protected readonly deliveryOptions = [
    { label: 'Free', value: 0 },
    { label: '₹20', value: 20 },
    { label: '₹30', value: 30 },
  ];
  protected readonly etaPresets = ETA_PRESETS;
  protected readonly validPresets = VALID_PRESETS;

  protected readonly deliveryCharge = signal(0);
  protected readonly etaMinutes = signal<number | null>(null);
  protected readonly validHours = signal<number | null>(null);

  protected readonly anyPreviousPrices = computed(() => this.priceList().size > 0);

  protected readonly changeSummary = computed(() => {
    this.priceTick();
    let changed = 0;
    let same = 0;
    for (const item of this.request.items) {
      const last = this.priceList().get(item.itemKey);
      const current = this.prices.get(item.itemKey)?.value ?? 0;
      if (!last) continue;
      if (last.unitPrice === current) same++;
      else changed++;
    }
    if (changed === 0 && same === 0) return 'Enter prices for each item';
    return changed > 0 ? `${changed} changed · ${same} same as last` : `No changes · ${same} same as last`;
  });

  async ngOnInit(): Promise<void> {
    const saved = await firstValueFrom(this.priceListApi.get());
    this.priceList.set(new Map(saved.map((e) => [e.itemKey, e])));

    for (const item of this.request.items) {
      const lastPrice = this.priceList().get(item.itemKey)?.unitPrice ?? 0;
      this.prices.set(item.itemKey, new FormControl(lastPrice, { nonNullable: true }));
    }
    this.recalculateTotal();
  }

  protected setDeliveryCharge(value: number): void {
    this.deliveryCharge.set(value);
    this.recalculateTotal();
  }

  protected lastEntry(itemKey: string): PriceListEntry | null {
    return this.priceList().get(itemKey) ?? null;
  }

  protected deltaClass(itemKey: string): string {
    this.priceTick();
    const last = this.priceList().get(itemKey);
    const current = this.prices.get(itemKey)?.value ?? 0;
    if (!last) return 'new';
    if (current === last.unitPrice) return 'same';
    return current > last.unitPrice ? 'up' : 'dn';
  }

  protected deltaLabel(itemKey: string): string {
    this.priceTick();
    const last = this.priceList().get(itemKey);
    const current = this.prices.get(itemKey)?.value ?? 0;
    if (!last) return "Enter today's price";
    if (current === last.unitPrice) return '✓ Same as last';
    const diff = Math.abs(current - last.unitPrice);
    return current > last.unitPrice ? `↑ ${rupeeLabel(diff)} from last` : `↓ ${rupeeLabel(diff)} from last`;
  }

  protected dateLabel(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  protected resetToLast(): void {
    for (const item of this.request.items) {
      const last = this.priceList().get(item.itemKey);
      if (last) this.prices.get(item.itemKey)?.setValue(last.unitPrice);
    }
    this.priceTick.update((n) => n + 1);
    this.recalculateTotal();
  }

  protected setPrice(itemKey: string, event: Event): void {
    const value = Number((event as CustomEvent).detail?.value ?? (event.target as HTMLInputElement).value) || 0;
    this.prices.get(itemKey)?.setValue(value);
    this.priceTick.update((n) => n + 1);
    this.recalculateTotal();
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected async submit(): Promise<void> {
    this.busy.set(true);
    try {
      const validUntil = this.validHours()
        ? new Date(Date.now() + this.validHours()! * 60 * 60 * 1000).toISOString()
        : null;
      await firstValueFrom(
        this.shopApi.submitQuote(this.request.id, {
          items: this.request.items.map((item) => ({
            itemKey: item.itemKey,
            unitPrice: this.prices.get(item.itemKey)?.value ?? 0,
          })),
          note: this.note.value.trim() || null,
          deliveryChargeAmount: this.deliveryCharge(),
          estimatedDeliveryMinutes: this.etaMinutes(),
          validUntil,
        }),
      );
      await this.modalCtrl.dismiss(null, 'save');
    } catch (e) {
      const toast = await this.toasts.create({ message: (e as Error).message, duration: 2500, color: 'danger' });
      await toast.present();
    } finally {
      this.busy.set(false);
    }
  }

  private recalculateTotal(): void {
    const itemsTotal = this.request.items.reduce((sum, item) => sum + item.qty * (this.prices.get(item.itemKey)?.value ?? 0), 0);
    this.totalAmount.set(itemsTotal + this.deliveryCharge());
  }
}
