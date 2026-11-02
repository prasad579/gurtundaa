import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { rupeeLabel } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonRadio,
  IonRadioGroup,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

export interface RecordMilkPaymentResult {
  amount: number;
  note: string | null;
}

type PaymentOption = 'today' | 'week' | 'balance' | 'custom';

/**
 * Replaces an `AlertController` dialog that mixed `radio` inputs with `number`/`text` inputs —
 * Ionic only renders the radio-list layout once any input is a radio, so the custom-amount and
 * note fields silently turned into unlabeled, non-functional radio circles (no text box at all).
 */
@Component({
  selector: 'app-milk-record-payment-sheet',
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
    IonRadioGroup,
    IonRadio,
    IonInput,
    IonTextarea,
    TranslatePipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">{{ 'common.cancel' | translate }}</ion-button></ion-buttons>
        <ion-title>{{ 'milk.recordPaymentTitle' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="!isValid()" (click)="save()">{{ 'common.save' | translate }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="muted">{{ 'milk.recordPaymentMessage' | translate }}</p>

      <ion-radio-group [formControl]="form.controls.option">
        <ion-list lines="none">
          @if (todayAmount > 0) {
            <ion-item>
              <ion-radio value="today" labelPlacement="end">{{ 'milk.todayPreset' | translate: { amount: rupeeLabel(todayAmount) } }}</ion-radio>
            </ion-item>
          }
          @if (weekAmount > 0) {
            <ion-item>
              <ion-radio value="week" labelPlacement="end">{{ 'milk.weekPreset' | translate: { amount: rupeeLabel(weekAmount) } }}</ion-radio>
            </ion-item>
          }
          @if (balanceAmount > 0) {
            <ion-item>
              <ion-radio value="balance" labelPlacement="end">{{ 'milk.fullBalancePreset' | translate: { amount: rupeeLabel(balanceAmount) } }}</ion-radio>
            </ion-item>
          }
          <ion-item>
            <ion-radio value="custom" labelPlacement="end">{{ 'milk.customAmountOption' | translate }}</ion-radio>
          </ion-item>
        </ion-list>
      </ion-radio-group>

      @if (form.controls.option.value === 'custom') {
        <ion-item>
          <ion-input
            [formControl]="form.controls.customAmount"
            type="number"
            inputmode="decimal"
            [placeholder]="'milk.customAmountPlaceholder' | translate"
          />
        </ion-item>
      }

      <ion-item>
        <ion-textarea
          [formControl]="form.controls.note"
          [placeholder]="'milk.notePlaceholder' | translate"
          [autoGrow]="true"
          [maxlength]="200"
        />
      </ion-item>
    </ion-content>
  `,
  styles: [`.muted { color: var(--ion-color-medium); font-size: 13px; }`],
})
export class MilkRecordPaymentSheetComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() todayAmount = 0;
  @Input() weekAmount = 0;
  @Input() balanceAmount = 0;

  protected readonly rupeeLabel = rupeeLabel;

  protected readonly form = new FormGroup({
    option: new FormControl<PaymentOption>('custom', { nonNullable: true }),
    customAmount: new FormControl<number | null>(null),
    note: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    const defaultOption: PaymentOption =
      this.balanceAmount > 0 ? 'balance' : this.todayAmount > 0 ? 'today' : this.weekAmount > 0 ? 'week' : 'custom';
    this.form.controls.option.setValue(defaultOption);
  }

  protected isValid(): boolean {
    return this.resolveAmount() > 0;
  }

  private resolveAmount(): number {
    const option = this.form.controls.option.value;
    if (option === 'today') return this.todayAmount;
    if (option === 'week') return this.weekAmount;
    if (option === 'balance') return this.balanceAmount;
    return Number(this.form.controls.customAmount.value) || 0;
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const result: RecordMilkPaymentResult = {
      amount: this.resolveAmount(),
      note: this.form.controls.note.value.trim() || null,
    };
    return this.modalCtrl.dismiss(result, 'save');
  }
}
