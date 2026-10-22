import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilkSubscription, SaveMilkSubscriptionRequest, SaveServiceContactRequest, ServiceContact, toDateOnlyString } from '@gurtundaa/shared';
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
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

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
    IonSegment,
    IonSegmentButton,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>{{ subscription ? 'edit subscription' : 'set up milk tracking 🥛' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <p class="label">how do you get your milk?</p>
        <ion-segment [value]="form.controls.isSelfCollected.value" (ionChange)="setSelfCollected($any($event.detail.value))">
          <ion-segment-button [value]="false"><ion-label>🧑‍🍼 delivered to me</ion-label></ion-segment-button>
          <ion-segment-button [value]="true"><ion-label>🛒 i collect it myself</ion-label></ion-segment-button>
        </ion-segment>

        <ion-list lines="none">
          @if (!form.controls.isSelfCollected.value) {
            <ion-item>
              <ion-input
                formControlName="name"
                label="milk delivery person name"
                labelPlacement="stacked"
                placeholder="Raju Milkman"
                [maxlength]="100"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="phone"
                label="phone number"
                labelPlacement="stacked"
                placeholder="98765 43210"
                [maxlength]="20"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="address"
                label="address (optional)"
                labelPlacement="stacked"
                placeholder="near temple…"
                [maxlength]="200"
              />
            </ion-item>
          }
          <ion-item>
            <ion-input
              formControlName="ratePerLtr"
              type="number"
              inputmode="decimal"
              label="rate per litre (₹)"
              labelPlacement="stacked"
              placeholder="60"
            />
          </ion-item>
          <ion-item>
            <ion-label>
              tracking starts from
              <p>
                Pick an earlier date if you already
                {{ form.controls.isSelfCollected.value ? 'collect milk daily' : 'get milk delivered' }}
                and want this month billed from day 1.
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

        <h2 class="section-title">🌅 {{ form.controls.isSelfCollected.value ? 'morning pickup' : 'morning delivery' }}</h2>
        <ion-list lines="none">
          <ion-item>
            <ion-toggle formControlName="morningEnabled">{{ form.controls.isSelfCollected.value ? 'pick up in the morning' : 'deliver in the morning' }}</ion-toggle>
          </ion-item>
          @if (form.controls.morningEnabled.value) {
            <ion-item>
              <ion-input
                formControlName="morningQuantityLtr"
                type="number"
                inputmode="decimal"
                label="quantity (Ltr)"
                labelPlacement="stacked"
                placeholder="2.0"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="morningWindowStart"
                type="time"
                [label]="(form.controls.isSelfCollected.value ? 'pickup timings' : 'delivery timings') + ' — from (optional)'"
                labelPlacement="stacked"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="morningWindowEnd"
                type="time"
                [label]="(form.controls.isSelfCollected.value ? 'pickup timings' : 'delivery timings') + ' — to (optional)'"
                labelPlacement="stacked"
              />
            </ion-item>
          }
        </ion-list>

        <h2 class="section-title">🌙 {{ form.controls.isSelfCollected.value ? 'evening pickup' : 'evening delivery' }}</h2>
        <ion-list lines="none">
          <ion-item>
            <ion-toggle formControlName="eveningEnabled">{{ form.controls.isSelfCollected.value ? 'pick up in the evening' : 'deliver in the evening' }}</ion-toggle>
          </ion-item>
          @if (form.controls.eveningEnabled.value) {
            <ion-item>
              <ion-input
                formControlName="eveningQuantityLtr"
                type="number"
                inputmode="decimal"
                label="quantity (Ltr)"
                labelPlacement="stacked"
                placeholder="1.0"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="eveningWindowStart"
                type="time"
                [label]="(form.controls.isSelfCollected.value ? 'pickup timings' : 'delivery timings') + ' — from (optional)'"
                labelPlacement="stacked"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="eveningWindowEnd"
                type="time"
                [label]="(form.controls.isSelfCollected.value ? 'pickup timings' : 'delivery timings') + ' — to (optional)'"
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
  `,
})
export class MilkSubscriptionEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

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
