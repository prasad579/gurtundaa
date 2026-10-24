import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MILK_QUANTITY_STEP_LTR,
  MilkSubscription,
  SaveMilkSubscriptionRequest,
  SaveServiceContactRequest,
  ServiceContact,
  toDateOnlyString,
} from '@gurtundaa/shared';
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
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

export interface SaveMilkSubscriptionFormResult {
  contact: SaveServiceContactRequest | null;
  subscription: Omit<SaveMilkSubscriptionRequest, 'contactId'>;
}

@Component({
  selector: 'app-milk-subscription-editor',
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
    IonToggle,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    TranslatePipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">{{ 'common.cancel' | translate }}</ion-button></ion-buttons>
        <ion-title>{{ (subscription ? 'milkSubscriptionEditor.editTitle' : 'milkSubscriptionEditor.newTitle') | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">{{ 'common.save' | translate }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <p class="label">{{ 'milkSubscriptionEditor.howQuestion' | translate }}</p>
        <div class="toggle-row">
          <button type="button" class="toggle-btn" [class.sel]="!form.controls.isSelfCollected.value" (click)="setSelfCollected(false)">🧑‍🍼 {{ 'milkSubscriptionEditor.deliveredToMe' | translate }}</button>
          <button type="button" class="toggle-btn" [class.sel]="form.controls.isSelfCollected.value" (click)="setSelfCollected(true)">🛒 {{ 'milkSubscriptionEditor.collectMyself' | translate }}</button>
        </div>

        <ion-list lines="none">
          @if (!form.controls.isSelfCollected.value) {
            <ion-item>
              <ion-input
                formControlName="name"
                [label]="'milkSubscriptionEditor.personName' | translate"
                labelPlacement="stacked"
                placeholder="Raju Milkman"
                [maxlength]="100"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="phone"
                [label]="'milkSubscriptionEditor.phoneNumber' | translate"
                labelPlacement="stacked"
                placeholder="98765 43210"
                [maxlength]="20"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="address"
                [label]="'milkSubscriptionEditor.addressLabel' | translate"
                labelPlacement="stacked"
                [placeholder]="'milkSubscriptionEditor.addressPlaceholder' | translate"
                [maxlength]="200"
              />
            </ion-item>
          }
          <ion-item>
            <ion-input
              formControlName="ratePerLtr"
              type="number"
              inputmode="decimal"
              [label]="'milkSubscriptionEditor.rateLabel' | translate"
              labelPlacement="stacked"
              placeholder="60"
            />
          </ion-item>
          <ion-item>
            <ion-label>
              {{ 'milkSubscriptionEditor.trackingStarts' | translate }}
              <p>
                {{ 'milkSubscriptionEditor.trackingHint' | translate: { verb: (form.controls.isSelfCollected.value ? 'milkSubscriptionEditor.collectDaily' : 'milkSubscriptionEditor.getDelivered') | translate } }}
              </p>
            </ion-label>
            <ion-datetime-button datetime="start-date" slot="end" />
          </ion-item>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="start-date" formControlName="startDate" presentation="date" [max]="today" />
            </ng-template>
          </ion-modal>
        </ion-list>

        <h2 class="section-title">🌅 {{ (form.controls.isSelfCollected.value ? 'milk.morningPickup' : 'milk.morningDelivery') | translate }}</h2>
        <ion-list lines="none">
          <ion-item>
            <ion-toggle formControlName="morningEnabled">{{ (form.controls.isSelfCollected.value ? 'milkSubscriptionEditor.pickUpMorning' : 'milkSubscriptionEditor.deliverMorning') | translate }}</ion-toggle>
          </ion-item>
          @if (form.controls.morningEnabled.value) {
            <ion-item>
              <ion-input
                formControlName="morningQuantityLtr"
                type="number"
                inputmode="decimal"
                step="0.5"
                [label]="'milkSubscriptionEditor.quantityLabel' | translate"
                labelPlacement="stacked"
                placeholder="2.0"
                (ionChange)="snapToMilkStep('morningQuantityLtr')"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="morningWindowStart"
                type="time"
                [label]="timingsLabel('from')"
                labelPlacement="stacked"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="morningWindowEnd"
                type="time"
                [label]="timingsLabel('to')"
                labelPlacement="stacked"
              />
            </ion-item>
          }
        </ion-list>

        <h2 class="section-title">🌙 {{ (form.controls.isSelfCollected.value ? 'milk.eveningPickup' : 'milk.eveningDelivery') | translate }}</h2>
        <ion-list lines="none">
          <ion-item>
            <ion-toggle formControlName="eveningEnabled">{{ (form.controls.isSelfCollected.value ? 'milkSubscriptionEditor.pickUpEvening' : 'milkSubscriptionEditor.deliverEvening') | translate }}</ion-toggle>
          </ion-item>
          @if (form.controls.eveningEnabled.value) {
            <ion-item>
              <ion-input
                formControlName="eveningQuantityLtr"
                type="number"
                inputmode="decimal"
                step="0.5"
                [label]="'milkSubscriptionEditor.quantityLabel' | translate"
                labelPlacement="stacked"
                placeholder="1.0"
                (ionChange)="snapToMilkStep('eveningQuantityLtr')"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="eveningWindowStart"
                type="time"
                [label]="timingsLabel('from')"
                labelPlacement="stacked"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="eveningWindowEnd"
                type="time"
                [label]="timingsLabel('to')"
                labelPlacement="stacked"
              />
            </ion-item>
          }
        </ion-list>
      </form>
    </ion-content>
  `,
  styles: `
    .section-title { margin: 20px 0 4px; padding: 0 16px; font-size: 13px; font-weight: 700; color: var(--ion-color-medium); }
    ion-label p { font-size: 10.5px; color: var(--ion-color-medium); white-space: normal; }
    .label { margin: 0 0 6px; padding: 0 2px; font-size: 11px; font-weight: 700; color: var(--ion-color-medium); }
    .toggle-row { display: flex; gap: 8px; margin: 0 0 4px; }
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
    .toggle-btn.sel { background: var(--ion-color-primary, #7c3aed); color: #fff; }
  `,
})
export class MilkSubscriptionEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly translate = inject(TranslateService);

  @Input() subscription?: MilkSubscription | null;
  @Input() contact?: ServiceContact | null;

  protected readonly today = toDateOnlyString(new Date());

  protected readonly form = new FormGroup({
    isSelfCollected: new FormControl(false, { nonNullable: true }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    address: new FormControl('', { nonNullable: true }),
    ratePerLtr: new FormControl(60, { nonNullable: true, validators: [Validators.required, Validators.min(0.1)] }),
    startDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    morningEnabled: new FormControl(true, { nonNullable: true }),
    morningQuantityLtr: new FormControl(2, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    morningWindowStart: new FormControl('', { nonNullable: true }),
    morningWindowEnd: new FormControl('', { nonNullable: true }),
    eveningEnabled: new FormControl(false, { nonNullable: true }),
    eveningQuantityLtr: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    eveningWindowStart: new FormControl('', { nonNullable: true }),
    eveningWindowEnd: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.contact) {
      this.form.patchValue({
        name: this.contact.name,
        phone: this.contact.phone,
        address: this.contact.address ?? '',
      });
    }
    if (this.subscription) {
      const s = this.subscription;
      // Subscriptions created before start-date tracking existed carry a sentinel (year 0001) —
      // show today instead of that nonsensical date in the picker.
      const startDate = s.startDate.startsWith('0001') ? this.today : s.startDate;
      this.setSelfCollected(s.isSelfCollected);
      this.form.patchValue({
        ratePerLtr: s.ratePerLtr,
        startDate,
        morningEnabled: s.morningEnabled,
        morningQuantityLtr: s.morningQuantityLtr,
        morningWindowStart: s.morningWindowStart?.slice(0, 5) ?? '',
        morningWindowEnd: s.morningWindowEnd?.slice(0, 5) ?? '',
        eveningEnabled: s.eveningEnabled,
        eveningQuantityLtr: s.eveningQuantityLtr,
        eveningWindowStart: s.eveningWindowStart?.slice(0, 5) ?? '',
        eveningWindowEnd: s.eveningWindowEnd?.slice(0, 5) ?? '',
      });
    }
  }

  protected setSelfCollected(value: boolean): void {
    this.form.controls.isSelfCollected.setValue(value);
    const [nameValidators, phoneValidators] = value
      ? [[Validators.maxLength(100)], [Validators.maxLength(20)]]
      : [[Validators.required, Validators.maxLength(100)], [Validators.required, Validators.maxLength(20)]];
    this.form.controls.name.setValidators(nameValidators);
    this.form.controls.phone.setValidators(phoneValidators);
    this.form.controls.name.updateValueAndValidity();
    this.form.controls.phone.updateValueAndValidity();
  }

  protected timingsLabel(which: 'from' | 'to'): string {
    const kind = this.translate.instant(this.form.controls.isSelfCollected.value ? 'milkSubscriptionEditor.pickupTimings' : 'milkSubscriptionEditor.deliveryTimings');
    const suffix = this.translate.instant(which === 'from' ? 'milkSubscriptionEditor.fromOptional' : 'milkSubscriptionEditor.toOptional');
    return `${kind} — ${suffix}`;
  }

  // Milk only comes in half-litre packets — snap odd decimals (2.1, 2.37) to the nearest 0.5 on commit.
  protected snapToMilkStep(control: 'morningQuantityLtr' | 'eveningQuantityLtr'): void {
    const current = this.form.controls[control].value;
    const snapped = Math.max(0, Math.round(current / MILK_QUANTITY_STEP_LTR) * MILK_QUANTITY_STEP_LTR);
    if (snapped !== current) this.form.controls[control].setValue(snapped);
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const result: SaveMilkSubscriptionFormResult = {
      contact: v.isSelfCollected
        ? null
        : {
            category: 'Milk',
            name: v.name.trim(),
            phone: v.phone.trim(),
            address: v.address.trim() || null,
            isDefault: true,
          },
      subscription: {
        isSelfCollected: v.isSelfCollected,
        startDate: v.startDate,
        morningEnabled: v.morningEnabled,
        morningQuantityLtr: Number(v.morningQuantityLtr),
        morningWindowStart: v.morningWindowStart ? `${v.morningWindowStart}:00` : null,
        morningWindowEnd: v.morningWindowEnd ? `${v.morningWindowEnd}:00` : null,
        eveningEnabled: v.eveningEnabled,
        eveningQuantityLtr: Number(v.eveningQuantityLtr),
        eveningWindowStart: v.eveningWindowStart ? `${v.eveningWindowStart}:00` : null,
        eveningWindowEnd: v.eveningWindowEnd ? `${v.eveningWindowEnd}:00` : null,
        ratePerLtr: Number(v.ratePerLtr),
      },
    };
    return this.modalCtrl.dismiss(result, 'save');
  }
}
