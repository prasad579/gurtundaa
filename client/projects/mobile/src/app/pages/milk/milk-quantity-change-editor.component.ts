import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilkQuantityChange, MilkSubscription, SaveMilkQuantityChangeRequest, toDateOnlyString } from '@gurtundaa/shared';
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
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

@Component({
  selector: 'app-milk-quantity-change-editor',
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
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>{{ change ? 'edit quantity change' : 'change quantity 🥛' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-list lines="none">
          <ion-item>
            <ion-label>from</ion-label>
            <ion-datetime-button datetime="qc-start" />
          </ion-item>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="qc-start" formControlName="startDate" presentation="date" [min]="today" />
            </ng-template>
          </ion-modal>

          <ion-item>
            <ion-label>to</ion-label>
            <ion-datetime-button datetime="qc-end" />
          </ion-item>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="qc-end" formControlName="endDate" presentation="date" [min]="form.controls.startDate.value" />
            </ng-template>
          </ion-modal>

          <ion-item>
            <ion-input
              formControlName="morningQuantityLtr"
              type="number"
              inputmode="decimal"
              label="🌅 morning quantity (Ltr)"
              labelPlacement="stacked"
              placeholder="2.0"
            />
          </ion-item>

          <ion-item>
            <ion-input
              formControlName="eveningQuantityLtr"
              type="number"
              inputmode="decimal"
              label="🌙 evening quantity (Ltr)"
              labelPlacement="stacked"
              placeholder="1.0"
            />
          </ion-item>

          <ion-item>
            <ion-textarea
              formControlName="reason"
              label="reason (optional)"
              labelPlacement="stacked"
              placeholder="guests staying over, festival season…"
              [autoGrow]="true"
              [maxlength]="200"
            />
          </ion-item>
        </ion-list>
      </form>
    </ion-content>
  `,
})
export class MilkQuantityChangeEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() change?: MilkQuantityChange;
  @Input() subscription?: MilkSubscription | null;

  protected readonly today = toDateOnlyString(new Date());

  protected readonly form = new FormGroup({
    startDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    morningQuantityLtr: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    eveningQuantityLtr: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    reason: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.change) {
      this.form.setValue({
        startDate: this.change.startDate,
        endDate: this.change.endDate,
        morningQuantityLtr: this.change.morningQuantityLtr,
        eveningQuantityLtr: this.change.eveningQuantityLtr,
        reason: this.change.reason ?? '',
      });
    } else if (this.subscription) {
      this.form.patchValue({
        morningQuantityLtr: this.subscription.morningEnabled ? this.subscription.morningQuantityLtr : 0,
        eveningQuantityLtr: this.subscription.eveningEnabled ? this.subscription.eveningQuantityLtr : 0,
      });
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveMilkQuantityChangeRequest = {
      startDate: v.startDate,
      endDate: v.endDate,
      morningQuantityLtr: Number(v.morningQuantityLtr),
      eveningQuantityLtr: Number(v.eveningQuantityLtr),
      reason: v.reason.trim() || null,
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
