import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { LaundryBatch, LaundryItemLine, MarkPickedUpRequest, rupeeLabel } from '@gurtundaa/shared';
import { IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, ModalController } from '@ionic/angular';

interface PriceRow {
  itemType: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-laundry-pickup',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent],
  templateUrl: './laundry-pickup.component.html',
  styleUrl: './laundry-pickup.component.scss',
})
export class LaundryPickupComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input({ required: true }) batch!: LaundryBatch;

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly rows = signal<PriceRow[]>([]);

  protected readonly total = computed(() => this.rows().reduce((sum, r) => sum + r.quantity * r.price, 0));

  ngOnInit(): void {
    this.rows.set(
      this.batch.items.map((item) => ({
        itemType: item.itemType,
        quantity: item.quantity,
        price: item.pricePerItem ?? 0,
      })),
    );
  }

  protected setPrice(index: number, value: string): void {
    const price = Math.max(0, Number(value) || 0);
    this.rows.update((rows) => rows.map((r, i) => (i === index ? { ...r, price } : r)));
  }

  protected lineTotal(row: PriceRow): number {
    return row.quantity * row.price;
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const items: LaundryItemLine[] = this.rows().map((r) => ({
      itemType: r.itemType,
      quantity: r.quantity,
      pricePerItem: r.price > 0 ? r.price : null,
    }));
    const request: MarkPickedUpRequest = { amount: this.total(), items };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
