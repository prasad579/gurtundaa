import { Component, Input, inject, signal } from '@angular/core';
import { formatCustomPack } from '@gurtundaa/shared';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark, pencil } from 'ionicons/icons';
import { MarketplaceCart } from '../../services/marketplace-cart';

type SmallUnit = 'g' | 'ml';
type BigUnit = 'kg' | 'L';

/** Pack-size chips (250g/500g/1kg/2kg…) plus a typed custom-quantity fallback — shared by the browse and cart screens. */
@Component({
  selector: 'app-pack-size-picker',
  imports: [IonIcon],
  template: `
    <div class="pack-chips">
      @for (opt of cart.packOptionsOf(itemKey); track opt) {
        <button class="pchip" [class.sel]="!customMode() && cart.packOf(itemKey) === opt" (click)="pick(opt)">
          {{ opt }}
        </button>
      }
      <button class="pchip custom-chip" [class.sel]="customMode() || cart.isCustomPack(itemKey)" (click)="toggleCustom()">
        @if (cart.isCustomPack(itemKey) && !customMode()) {
          {{ cart.packOf(itemKey) }}
        } @else {
          <ion-icon name="pencil" />
        }
      </button>
    </div>

    @if (customMode()) {
      <div class="custom-row">
        <input
          type="number"
          inputmode="decimal"
          min="0"
          step="0.1"
          placeholder="qty"
          [value]="customValue() ?? ''"
          (input)="customValue.set($any($event.target).value)"
        />
        <div class="unit-toggle">
          <button [class.sel]="customUnit() === smallUnit()" (click)="customUnit.set(smallUnit())">{{ smallUnit() }}</button>
          <button [class.sel]="customUnit() === bigUnit()" (click)="customUnit.set(bigUnit())">{{ bigUnit() }}</button>
        </div>
        <button class="confirm-btn" (click)="confirmCustom()"><ion-icon name="checkmark" /></button>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 160px;
    }
    .pack-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .pchip {
      background: var(--ion-color-step-50, #f7f8fb);
      border: 1.3px solid var(--ion-color-step-150, #ddd);
      color: var(--ion-color-dark, #333);
      font-size: 9.5px;
      font-weight: 700;
      padding: 4px 7px;
      border-radius: 8px;

      &.sel {
        background: var(--ion-color-primary, #7c3aed);
        border-color: var(--ion-color-primary, #7c3aed);
        color: #fff;
      }
    }
    .custom-chip {
      display: flex;
      align-items: center;
      ion-icon { font-size: 11px; }
    }
    .custom-row {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 5px;
    }
    .custom-row input {
      width: 54px;
      border: 1.3px solid var(--ion-color-step-150, #ddd);
      border-radius: 8px;
      padding: 4px 6px;
      font-size: 11px;
      font-weight: 700;
      min-width: 0;
    }
    .unit-toggle {
      display: flex;
      border: 1.3px solid var(--ion-color-step-150, #ddd);
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;

      button {
        padding: 4px 6px;
        font-size: 9.5px;
        font-weight: 700;
        background: var(--ion-color-step-50, #f7f8fb);
        color: var(--ion-color-dark, #333);

        &.sel { background: var(--ion-color-primary, #7c3aed); color: #fff; }
      }
    }
    .confirm-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--ion-color-primary, #7c3aed);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      ion-icon { font-size: 13px; }
    }
  `,
})
export class PackSizePickerComponent {
  @Input({ required: true }) itemKey!: string;

  protected readonly cart = inject(MarketplaceCart);

  protected readonly customMode = signal(false);
  protected readonly customValue = signal<string | null>(null);
  protected readonly customUnit = signal<SmallUnit | BigUnit>('kg');

  constructor() {
    addIcons({ pencil, checkmark });
  }

  protected smallUnit(): SmallUnit {
    return this.cart.unitFamilyOf(this.itemKey) === 'volume' ? 'ml' : 'g';
  }

  protected bigUnit(): BigUnit {
    return this.cart.unitFamilyOf(this.itemKey) === 'volume' ? 'L' : 'kg';
  }

  protected pick(opt: string): void {
    this.customMode.set(false);
    this.cart.selectPack(this.itemKey, opt);
  }

  protected toggleCustom(): void {
    const opening = !this.customMode();
    this.customMode.set(opening);
    if (opening) {
      this.customUnit.set(this.bigUnit());
      this.customValue.set(null);
    }
  }

  protected confirmCustom(): void {
    const value = parseFloat(this.customValue() ?? '');
    if (!value || value <= 0) return;
    this.cart.setCustomPack(this.itemKey, formatCustomPack(value, this.customUnit()));
    this.customMode.set(false);
  }
}
