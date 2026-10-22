import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ManualMilkApi, ManualMilkDayCustomer, rupeeLabel, shortDateLabel } from '@gurtundaa/shared';
import { IonButton, IonButtons, IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-milk-day-detail',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ shortDateLabel(date) }}</ion-title>
        <ion-buttons slot="end"><ion-button (click)="dismiss()">close</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (loading()) {
        <div class="center"><ion-spinner /></div>
      } @else if (customers().length === 0) {
        <p class="muted">No shops expected this day.</p>
      } @else {
        @for (c of customers(); track c.providerCustomerId) {
          <div class="row">
            <div class="info">
              <div class="nm">{{ c.customerName }}</div>
              <div class="meta">
                @if (c.loggedEntry) {
                  {{ c.loggedEntry.quantityLtr }} L logged · {{ rupeeLabel(c.loggedEntry.amount) }}
                  {{ c.loggedEntry.isPaid ? '· paid' : '· pending' }}
                } @else {
                  {{ c.plannedQuantityLtr }} L planned · not logged yet
                }
              </div>
            </div>
            <ion-button size="small" fill="outline" (click)="manage(c.providerCustomerId)">Manage</ion-button>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .center { display: flex; justify-content: center; padding: 40px 0; }
      .muted { color: var(--ion-color-medium); font-size: 13px; }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--ion-color-step-100, #f1eef9);
      }
      .row:last-child { border-bottom: none; }
      .nm { font-size: 13px; font-weight: 700; }
      .meta { font-size: 11px; color: var(--ion-color-medium); margin-top: 2px; }
    `,
  ],
})
export class MilkDayDetailComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly manualMilk = inject(ManualMilkApi);

  @Input({ required: true }) date!: string;

  protected readonly rupeeLabel = rupeeLabel;
  protected readonly shortDateLabel = shortDateLabel;
  protected readonly loading = signal(true);
  protected readonly customers = signal<ManualMilkDayCustomer[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      this.customers.set(await firstValueFrom(this.manualMilk.getDayDetail(this.date)));
    } finally {
      this.loading.set(false);
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss();
  }

  protected manage(providerCustomerId: string): void {
    void this.modalCtrl.dismiss({ providerCustomerId }, 'manage');
  }
}
