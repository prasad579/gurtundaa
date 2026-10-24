import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MILK_QUANTITY_STEP_LTR, MilkSlot, SaveMilkExtraRequestRequest, parseDateOnly, toDateOnlyString } from '@gurtundaa/shared';

type ExtraMode = 'Single' | 'Range';

const MAX_RANGE_DAYS = 60;
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
import { TranslatePipe } from '@ngx-translate/core';

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
    TranslatePipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">{{ 'common.cancel' | translate }}</ion-button></ion-buttons>
        <ion-title>{{ 'milkExtraEditor.title' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid || rangeTooLong()" (click)="save()">{{ 'common.save' | translate }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <div class="toggle-row">
          <button type="button" class="toggle-btn" [class.sel]="form.controls.slot.value === 'Morning'" (click)="form.controls.slot.setValue('Morning')">🌅 {{ 'milkExtraEditor.morning' | translate }}</button>
          <button type="button" class="toggle-btn" [class.sel]="form.controls.slot.value === 'Evening'" (click)="form.controls.slot.setValue('Evening')">🌙 {{ 'milkExtraEditor.evening' | translate }}</button>
        </div>

        <div class="toggle-row mode-toggle">
          <button type="button" class="toggle-btn" [class.sel]="mode() === 'Single'" (click)="setMode('Single')">{{ 'milkExtraEditor.singleDay' | translate }}</button>
          <button type="button" class="toggle-btn" [class.sel]="mode() === 'Range'" (click)="setMode('Range')">{{ 'milkExtraEditor.dateRange' | translate }}</button>
        </div>

        <ion-list lines="none">
          @if (mode() === 'Single') {
            <ion-item>
              <ion-label>
                {{ 'milkExtraEditor.date' | translate }}
                <p>{{ 'milkExtraEditor.dateHint' | translate }}</p>
              </ion-label>
              <ion-datetime-button datetime="extra-date" slot="end" />
            </ion-item>
            <ion-modal #dateModal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime id="extra-date" formControlName="date" presentation="date" (ionChange)="dateModal.dismiss()" />
              </ng-template>
            </ion-modal>
          } @else {
            <ion-item>
              <ion-label>{{ 'milkExtraEditor.from' | translate }}</ion-label>
              <ion-datetime-button datetime="extra-from" slot="end" />
            </ion-item>
            <ion-modal #fromModal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime id="extra-from" formControlName="date" presentation="date" (ionChange)="fromModal.dismiss()" />
              </ng-template>
            </ion-modal>

            <ion-item>
              <ion-label>{{ 'milkExtraEditor.to' | translate }}</ion-label>
              <ion-datetime-button datetime="extra-to" slot="end" />
            </ion-item>
            <ion-modal #toModal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime
                  id="extra-to"
                  formControlName="endDate"
                  presentation="date"
                  [min]="form.controls.date.value"
                  (ionChange)="toModal.dismiss()"
                />
              </ng-template>
            </ion-modal>

            @if (rangeDayCount(); as count) {
              <p class="range-hint">
                {{ (count === 1 ? 'milkExtraEditor.rangeHintOne' : 'milkExtraEditor.rangeHintMany') | translate: { count } }}
              </p>
            }
            @if (rangeTooLong()) {
              <p class="range-error">{{ 'milkExtraEditor.rangeError' | translate: { max: maxRangeDays } }}</p>
            }
          }

          <ion-item>
            <ion-input
              formControlName="quantityLtr"
              type="number"
              inputmode="decimal"
              step="0.5"
              [label]="'milkExtraEditor.quantityLabel' | translate"
              labelPlacement="stacked"
              placeholder="1.0"
              (ionChange)="snapToMilkStep()"
            />
          </ion-item>

          <ion-item>
            <ion-textarea
              formControlName="reason"
              [label]="'milkExtraEditor.reasonLabel' | translate"
              labelPlacement="stacked"
              [placeholder]="'milkExtraEditor.reasonPlaceholder' | translate"
              [autoGrow]="true"
              [maxlength]="200"
            />
          </ion-item>
        </ion-list>
      </form>
    </ion-content>
  `,
  styles: `
    ion-label p { font-size: 10.5px; color: var(--ion-color-medium); white-space: normal; }
    .toggle-row {
      display: flex;
      gap: 8px;
      margin: 0 0 4px;
    }
    .mode-toggle { margin-top: 14px; }
    .toggle-btn {
      flex: 1;
      padding: 10px 8px;
      border: none;
      border-radius: 12px;
      background: var(--ion-color-step-50, #f3f0fa);
      color: var(--ion-color-medium, #8a7fa3);
      font-size: 13px;
      font-weight: 700;
      text-align: center;
    }
    .toggle-btn.sel {
      background: var(--ion-color-primary, #7c3aed);
      color: #fff;
    }
    .range-hint { font-size: 11px; color: var(--ion-color-medium); margin: 2px 16px 0; }
    .range-error { font-size: 11px; color: var(--ion-color-danger, #eb445a); margin: 2px 16px 0; }
  `,
})
export class MilkExtraEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  /** Pre-fills the date when opened from a specific day's calendar detail, instead of defaulting to today. */
  @Input() initialDate?: string;

  protected readonly today = toDateOnlyString(new Date());
  protected readonly maxRangeDays = MAX_RANGE_DAYS;
  protected readonly mode = signal<ExtraMode>('Single');

  protected readonly form = new FormGroup({
    slot: new FormControl<MilkSlot>('Morning', { nonNullable: true }),
    date: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    quantityLtr: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(MILK_QUANTITY_STEP_LTR)] }),
    reason: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.initialDate) {
      this.form.controls.date.setValue(this.initialDate);
      this.form.controls.endDate.setValue(this.initialDate);
    }
  }

  protected setMode(value: ExtraMode): void {
    this.mode.set(value);
  }

  protected rangeDayCount(): number | null {
    if (this.mode() !== 'Range') return null;
    const { date, endDate } = this.form.getRawValue();
    if (endDate < date) return null;
    return dateRange(date, endDate).length;
  }

  protected rangeTooLong(): boolean {
    const count = this.rangeDayCount();
    return count !== null && count > MAX_RANGE_DAYS;
  }

  // Milk only comes in half-litre packets — snap odd decimals (2.1, 2.37) to the nearest 0.5 on commit.
  protected snapToMilkStep(): void {
    const current = this.form.controls.quantityLtr.value;
    const snapped = Math.max(MILK_QUANTITY_STEP_LTR, Math.round(current / MILK_QUANTITY_STEP_LTR) * MILK_QUANTITY_STEP_LTR);
    if (snapped !== current) this.form.controls.quantityLtr.setValue(snapped);
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    if (this.rangeTooLong()) return Promise.resolve(false);

    const v = this.form.getRawValue();
    const dates = this.mode() === 'Range' ? dateRange(v.date, v.endDate) : [v.date];
    const requests: SaveMilkExtraRequestRequest[] = dates.map((date) => ({
      date,
      slot: v.slot,
      quantityLtr: Number(v.quantityLtr),
      reason: v.reason.trim() || null,
    }));
    return this.modalCtrl.dismiss(requests, 'save');
  }
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = parseDateOnly(start);
  const last = parseDateOnly(end);
  while (current <= last) {
    dates.push(toDateOnlyString(current));
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }
  return dates;
}
