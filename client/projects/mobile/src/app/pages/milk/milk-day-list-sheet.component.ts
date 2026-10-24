import { Component, Input, inject } from '@angular/core';
import { MilkCalendarDay, shortDateLabel } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

@Component({
  selector: 'app-milk-day-list-sheet',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }} ({{ days.length }})</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">✕</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="full">
        @for (day of days; track day.date) {
          <ion-item button (click)="select(day)">
            <ion-label>{{ shortDateLabel(day.date) }}</ion-label>
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
})
export class MilkDayListSheetComponent {
  private readonly modalCtrl = inject(ModalController);

  @Input({ required: true }) title = '';
  @Input({ required: true }) days: MilkCalendarDay[] = [];

  protected readonly shortDateLabel = shortDateLabel;

  protected select(day: MilkCalendarDay): void {
    void this.modalCtrl.dismiss(day, 'select');
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }
}
