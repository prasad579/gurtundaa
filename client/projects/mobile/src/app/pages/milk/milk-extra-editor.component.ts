import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilkSlot, SaveMilkExtraRequestRequest, toDateOnlyString } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
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
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

@Component({
  selector: 'app-milk-extra-editor',
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
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>request extra milk 🥛</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-segment formControlName="slot">
          <ion-segment-button value="Morning">🌅 Morning</ion-segment-button>
          <ion-segment-button value="Evening">🌙 Evening</ion-segment-button>
        </ion-segment>

        <ion-list lines="none">
          <ion-item>
            <ion-label>date</ion-label>
            <ion-datetime-button datetime="extra-date" />
          </ion-item>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="extra-date" formControlName="date" presentation="date" [min]="today" />
            </ng-template>
          </ion-modal>

          <ion-item>
            <ion-input
              formControlName="quantityLtr"
              type="number"
              inputmode="decimal"
              label="extra quantity (Ltr)"
              labelPlacement="stacked"
              placeholder="1.0"
            />
          </ion-item>

          <ion-item>
            <ion-textarea
              formControlName="reason"
              label="reason (optional)"
              labelPlacement="stacked"
              placeholder="guests, function…"
              [autoGrow]="true"
              [maxlength]="200"
            />
          </ion-item>
        </ion-list>
      </form>
    </ion-content>
  `,
})
export class MilkExtraEditorComponent {
  private readonly modalCtrl = inject(ModalController);

  protected readonly today = toDateOnlyString(new Date());

  protected readonly form = new FormGroup({
    slot: new FormControl<MilkSlot>('Morning', { nonNullable: true }),
    date: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    quantityLtr: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.1)] }),
    reason: new FormControl('', { nonNullable: true }),
  });

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveMilkExtraRequestRequest = {
      date: v.date,
      slot: v.slot,
      quantityLtr: Number(v.quantityLtr),
      reason: v.reason.trim() || null,
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
