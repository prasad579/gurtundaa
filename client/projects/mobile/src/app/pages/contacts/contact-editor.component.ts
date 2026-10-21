import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SaveServiceContactRequest, ServiceContact, ServiceContactCategory } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

export const CONTACT_CATEGORY_OPTIONS: { value: ServiceContactCategory; label: string }[] = [
  { value: 'Milk', label: '🥛 Milk' },
  { value: 'Laundry', label: '🧺 Laundry' },
  { value: 'Electrician', label: '⚡ Electrician' },
  { value: 'Plumber', label: '🔧 Plumber' },
  { value: 'Family', label: '👨‍👩‍👧 Family' },
  { value: 'Shop', label: '🛒 Shop' },
  { value: 'Other', label: '📇 Other' },
];

@Component({
  selector: 'app-contact-editor',
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
    IonSelect,
    IonSelectOption,
    IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>{{ contact ? 'edit contact' : 'add contact' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <ion-list lines="none">
          <ion-item>
            <ion-select formControlName="category" label="category" labelPlacement="stacked" interface="popover">
              @for (opt of categoryOptions; track opt.value) {
                <ion-select-option [value]="opt.value">{{ opt.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input formControlName="name" label="name" labelPlacement="stacked" placeholder="Raju Milkman" [maxlength]="100" />
          </ion-item>
          <ion-item>
            <ion-input formControlName="phone" label="phone number" labelPlacement="stacked" placeholder="98765 43210" [maxlength]="20" />
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
            <ion-toggle formControlName="isDefault">set as default for this category</ion-toggle>
          </ion-item>
        </ion-list>
      </form>
    </ion-content>
  `,
})
export class ContactEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() contact?: ServiceContact;
  @Input() defaultCategory?: ServiceContactCategory;

  protected readonly categoryOptions = CONTACT_CATEGORY_OPTIONS;

  protected readonly form = new FormGroup({
    category: new FormControl<ServiceContactCategory>('Family', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    address: new FormControl('', { nonNullable: true }),
    isDefault: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.contact) {
      this.form.setValue({
        category: this.contact.category,
        name: this.contact.name,
        phone: this.contact.phone,
        address: this.contact.address ?? '',
        isDefault: this.contact.isDefault,
      });
    } else if (this.defaultCategory) {
      this.form.patchValue({ category: this.defaultCategory });
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveServiceContactRequest = {
      category: v.category,
      name: v.name.trim(),
      phone: v.phone.trim(),
      address: v.address.trim() || null,
      isDefault: v.isDefault,
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
