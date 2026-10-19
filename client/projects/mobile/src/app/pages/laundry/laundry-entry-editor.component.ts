import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BillData,
  LAUNDRY_SERVICE_TYPE_LABELS,
  LaundryBatch,
  LaundryItemLine,
  LaundryServiceType,
  SaveLaundryBatchRequest,
  ServiceContact,
  formatWhatsAppBill,
  shareOnWhatsApp,
  shortDateLabel,
  toDateOnlyString,
} from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { LAUNDRY_ITEM_TYPES } from './laundry-item-constants';

@Component({
  selector: 'app-laundry-entry-editor',
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
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonCheckbox,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonTextarea,
  ],
  templateUrl: './laundry-entry-editor.component.html',
  styleUrl: './laundry-entry-editor.component.scss',
})
export class LaundryEntryEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() batch?: LaundryBatch;
  @Input() contacts: ServiceContact[] = [];

  protected readonly itemTypes = LAUNDRY_ITEM_TYPES;
  protected readonly today = toDateOnlyString(new Date());
  protected readonly quantities = signal<Record<string, number>>({});
  protected readonly prices = signal<Record<string, number>>({});
  protected readonly serviceType = signal<LaundryServiceType>('WashAndIron');

  protected readonly form = new FormGroup({
    contactId: new FormControl<string | null>(null, { nonNullable: true }),
    givenOn: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    expectedReturn: new FormControl('', { nonNullable: true }),
    otherType: new FormControl('', { nonNullable: true }),
    otherQty: new FormControl(0, { nonNullable: true }),
    otherPrice: new FormControl(0, { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    notifyDhobi: new FormControl(true, { nonNullable: true }),
  });

  protected readonly total = computed(() => {
    const quantities = this.quantities();
    const prices = this.prices();
    let sum = 0;
    for (const [itemType, qty] of Object.entries(quantities)) {
      sum += qty * (prices[itemType] ?? 0);
    }
    return sum;
  });

  ngOnInit(): void {
    const defaultContact = this.contacts.find((c) => c.isDefault) ?? this.contacts[0];
    if (defaultContact) {
      this.form.patchValue({ contactId: defaultContact.id });
    }

    if (this.batch) {
      this.serviceType.set(this.batch.serviceType);
      const known = new Set(this.itemTypes.map((t) => t.label));
      const quantities: Record<string, number> = {};
      const prices: Record<string, number> = {};
      let other: LaundryItemLine | undefined;
      for (const item of this.batch.items) {
        if (known.has(item.itemType)) {
          quantities[item.itemType] = item.quantity;
          if (item.pricePerItem) prices[item.itemType] = item.pricePerItem;
        } else {
          other = item;
        }
      }
      this.quantities.set(quantities);
      this.prices.set(prices);
      this.form.setValue({
        contactId: this.batch.contactId,
        givenOn: this.batch.givenOn,
        expectedReturn: this.batch.expectedReturn ?? '',
        otherType: other?.itemType ?? '',
        otherQty: other?.quantity ?? 0,
        otherPrice: other?.pricePerItem ?? 0,
        notes: this.batch.notes ?? '',
        notifyDhobi: false,
      });
    }
  }

  protected quantity(itemType: string): number {
    return this.quantities()[itemType] ?? 0;
  }

  protected price(itemType: string): number {
    return this.prices()[itemType] ?? 0;
  }

  protected adjust(itemType: string, delta: number): void {
    this.quantities.update((q) => ({ ...q, [itemType]: Math.max(0, (q[itemType] ?? 0) + delta) }));
  }

  protected setQuantity(itemType: string, value: string): void {
    const qty = Math.max(0, Math.floor(Number(value) || 0));
    this.quantities.update((q) => ({ ...q, [itemType]: qty }));
  }

  protected setPrice(itemType: string, value: string): void {
    const price = Math.max(0, Number(value) || 0);
    this.prices.update((p) => ({ ...p, [itemType]: price }));
  }

  protected adjustOther(delta: number): void {
    const current = this.form.controls.otherQty.value;
    this.form.controls.otherQty.setValue(Math.max(0, current + delta));
  }

  protected setOtherQty(value: string): void {
    this.form.controls.otherQty.setValue(Math.max(0, Math.floor(Number(value) || 0)));
  }

  protected otherLineTotal(): number {
    return this.form.controls.otherQty.value * this.form.controls.otherPrice.value;
  }

  protected get hasAnyItem(): boolean {
    const hasPredefined = Object.values(this.quantities()).some((q) => q > 0);
    const hasOther = !!this.form.controls.otherType.value.trim() && this.form.controls.otherQty.value > 0;
    return hasPredefined || hasOther;
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const prices = this.prices();
    const items: LaundryItemLine[] = Object.entries(this.quantities())
      .filter(([, qty]) => qty > 0)
      .map(([itemType, quantity]) => ({ itemType, quantity, pricePerItem: prices[itemType] || null }));

    const otherType = v.otherType.trim();
    if (otherType && v.otherQty > 0) {
      items.push({ itemType: otherType, quantity: v.otherQty, pricePerItem: v.otherPrice || null });
    }

    const request: SaveLaundryBatchRequest = {
      contactId: v.contactId,
      serviceType: this.serviceType(),
      givenOn: v.givenOn,
      expectedReturn: v.expectedReturn || null,
      items,
      notes: v.notes.trim() || null,
    };

    if (!this.batch && v.notifyDhobi) {
      const contact = this.contacts.find((c) => c.id === v.contactId);
      if (contact) this.notifyDhobiOfItems(contact, items);
    }

    return this.modalCtrl.dismiss(request, 'save');
  }

  private notifyDhobiOfItems(contact: ServiceContact, items: LaundryItemLine[]): void {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const bill: BillData = {
      icon: '🧺',
      title: 'New Laundry Entry',
      subtitleLines: [
        `📅 ${shortDateLabel(this.form.controls.givenOn.value)}`,
        LAUNDRY_SERVICE_TYPE_LABELS[this.serviceType()],
      ],
      items: items.map((i) => ({ label: i.itemType, qty: String(i.quantity) })),
      quantitySummary: { label: 'Total Items', value: String(totalItems) },
      closingLine: 'Thank you! 🙏',
    };
    shareOnWhatsApp(contact.phone, formatWhatsAppBill(bill));
  }
}
