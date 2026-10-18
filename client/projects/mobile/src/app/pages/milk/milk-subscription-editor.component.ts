import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilkSubscription, SaveMilkSubscriptionRequest, SaveServiceContactRequest, ServiceContact } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

export interface SaveMilkSubscriptionFormResult {
  contact: SaveServiceContactRequest;
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
    IonInput,
    IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>{{ subscription ? 'edit subscription' : 'set up milk delivery 🥛' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-list lines="none">
          <ion-item>
            <ion-input
              formControlName="name"
              label="milkman's name"
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
        </ion-list>

        <h2 class="section-title">🌅 morning delivery</h2>
        <ion-list lines="none">
          <ion-item>
            <ion-toggle formControlName="morningEnabled">deliver in the morning</ion-toggle>
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
              <ion-input formControlName="morningWindowStart" type="time" label="window start (optional)" labelPlacement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input formControlName="morningWindowEnd" type="time" label="window end (optional)" labelPlacement="stacked" />
            </ion-item>
          }
        </ion-list>

        <h2 class="section-title">🌙 evening delivery</h2>
        <ion-list lines="none">
          <ion-item>
            <ion-toggle formControlName="eveningEnabled">deliver in the evening</ion-toggle>
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
              <ion-input formControlName="eveningWindowStart" type="time" label="window start (optional)" labelPlacement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input formControlName="eveningWindowEnd" type="time" label="window end (optional)" labelPlacement="stacked" />
            </ion-item>
          }
        </ion-list>
      </form>
    </ion-content>
  `,
  styles: `
    .section-title { margin: 20px 0 4px; padding: 0 16px; font-size: 13px; font-weight: 700; color: var(--ion-color-medium); }
  `,
})
export class MilkSubscriptionEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() subscription?: MilkSubscription | null;
  @Input() contact?: ServiceContact | null;

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    address: new FormControl('', { nonNullable: true }),
    ratePerLtr: new FormControl(60, { nonNullable: true, validators: [Validators.required, Validators.min(0.1)] }),
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
      this.form.patchValue({
        ratePerLtr: s.ratePerLtr,
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

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const result: SaveMilkSubscriptionFormResult = {
      contact: {
        category: 'Milk',
        name: v.name.trim(),
        phone: v.phone.trim(),
        address: v.address.trim() || null,
        isDefault: true,
      },
      subscription: {
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
