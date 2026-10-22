import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilkSlot, ProviderManualCustomer, SaveProviderManualCustomerRequest } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

@Component({
  selector: 'app-add-manual-customer',
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
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>{{ customer ? 'edit customer' : 'add customer' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-list lines="none">
          <ion-item>
            <ion-input formControlName="name" label="name" labelPlacement="stacked" placeholder="Sharma Tea Stall" [maxlength]="100" />
          </ion-item>
          <ion-item>
            <ion-input
              formControlName="phone"
              label="phone (optional)"
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
              placeholder="near bus stand…"
              [maxlength]="200"
            />
          </ion-item>
          <ion-item>
            <ion-input
              formControlName="notes"
              label="notes (optional)"
              labelPlacement="stacked"
              placeholder="e.g. usual order, special instructions"
              [maxlength]="500"
            />
          </ion-item>

          @if (showMilkDefaults) {
            <ion-item>
              <ion-input
                formControlName="defaultQuantityLtr"
                type="number"
                label="usual daily order (L, optional)"
                labelPlacement="stacked"
                placeholder="e.g. 5"
                min="0.1"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="defaultRatePerLtr"
                type="number"
                label="usual rate per litre (₹, optional)"
                labelPlacement="stacked"
                placeholder="e.g. 55"
                min="0.1"
              />
            </ion-item>
            <ion-item>
              <ion-input
                formControlName="defaultVariety"
                label="usual variety (optional)"
                labelPlacement="stacked"
                placeholder="e.g. Regular, Gold, Buffalo"
                [maxlength]="50"
              />
            </ion-item>
            <ion-item lines="none">
              <ion-segment formControlName="defaultSlot">
                <ion-segment-button value="Morning"><ion-label>🌅 Morning</ion-label></ion-segment-button>
                <ion-segment-button value="Evening"><ion-label>🌆 Evening</ion-label></ion-segment-button>
              </ion-segment>
            </ion-item>
          }
        </ion-list>
      </form>
    </ion-content>
  `,
})
export class AddManualCustomerComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() customer?: ProviderManualCustomer;
  @Input() showMilkDefaults = false;

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    phone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    defaultQuantityLtr: new FormControl<number | null>(null),
    defaultRatePerLtr: new FormControl<number | null>(null),
    defaultSlot: new FormControl<MilkSlot>('Morning', { nonNullable: true }),
    defaultVariety: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.customer) {
      this.form.setValue({
        name: this.customer.name,
        phone: this.customer.phone ?? '',
        address: this.customer.address ?? '',
        notes: this.customer.notes ?? '',
        defaultQuantityLtr: this.customer.defaultQuantityLtr,
        defaultRatePerLtr: this.customer.defaultRatePerLtr,
        defaultSlot: this.customer.defaultSlot,
        defaultVariety: this.customer.defaultVariety ?? '',
      });
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveProviderManualCustomerRequest = {
      name: v.name.trim(),
      phone: v.phone.trim() || null,
      address: v.address.trim() || null,
      notes: v.notes.trim() || null,
      defaultQuantityLtr: v.defaultQuantityLtr || null,
      defaultRatePerLtr: v.defaultRatePerLtr || null,
      defaultSlot: v.defaultSlot,
      defaultVariety: v.defaultVariety.trim() || null,
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
