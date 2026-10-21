import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilkSlot, SaveMilkExtraRequestRequest, parseDateOnly, toDateOnlyString } from '@gurtundaa/shared';

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
          <ion-button strong="true" [disabled]="form.invalid || rangeTooLong()" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-segment formControlName="slot">
          <ion-segment-button value="Morning">🌅 Morning</ion-segment-button>
          <ion-segment-button value="Evening">🌙 Evening</ion-segment-button>
        </ion-segment>

        <ion-segment class="mode-segment" [value]="mode()" (ionChange)="setMode($any($event.detail.value))">
          <ion-segment-button value="Single">Single Day</ion-segment-button>
          <ion-segment-button value="Range">Date Range</ion-segment-button>
        </ion-segment>

        <ion-list lines="none">
          @if (mode() === 'Single') {
            <ion-item>
              <ion-label>
                date
                <p>Pick a past date to log extra you already consumed, or a future date to give your milkman advance notice.</p>
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
              <ion-label>from</ion-label>
              <ion-datetime-button datetime="extra-from" slot="end" />
            </ion-item>
            <ion-modal #fromModal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime id="extra-from" formControlName="date" presentation="date" (ionChange)="fromModal.dismiss()" />
              </ng-template>
            </ion-modal>

            <ion-item>
              <ion-label>to</ion-label>
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
                {{ count }} day{{ count === 1 ? '' : 's' }} — same extra quantity logged for each day in the range.
              </p>
            }
            @if (rangeTooLong()) {
              <p class="range-error">Keep the range to {{ maxRangeDays }} days or fewer.</p>
            }
          }

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
  styles: `
    ion-label p { font-size: 10.5px; color: var(--ion-color-medium); white-space: normal; }
    .mode-segment { margin-top: 10px; }
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
    quantityLtr: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.1)] }),
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
