import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toDateOnlyString } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
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

export interface LaundryPickupRequestResult {
  when: string;
  note: string | null;
}

/**
 * Replaces an `AlertController` dialog that mixed `radio` inputs (Today/Tomorrow) with a `text`
 * input (note) — Ionic only renders the radio-list layout once any input is a radio, so the note
 * field silently turned into an unlabeled, non-functional radio circle (no text box at all).
 */
@Component({
  selector: 'app-laundry-pickup-request-sheet',
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
    IonTextarea,
    TranslatePipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">{{ 'common.cancel' | translate }}</ion-button></ion-buttons>
        <ion-title>{{ 'laundry.requestPickupTitle' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" (click)="send()">{{ 'laundry.send' | translate }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="muted">{{ 'laundry.requestPickupMessage' | translate }}</p>

      <ion-radio-group [formControl]="form.controls.when">
        <ion-list lines="none">
          <ion-item>
            <ion-radio [value]="today" labelPlacement="end">{{ 'laundry.todayLabel' | translate }}</ion-radio>
          </ion-item>
          <ion-item>
            <ion-radio [value]="tomorrow" labelPlacement="end">{{ 'laundry.tomorrowLabel' | translate }}</ion-radio>
          </ion-item>
        </ion-list>
      </ion-radio-group>

      <ion-item>
        <ion-textarea [formControl]="form.controls.note" [placeholder]="'laundry.notePlaceholder' | translate" [autoGrow]="true" [maxlength]="200" />
      </ion-item>
    </ion-content>
  `,
  styles: [`.muted { color: var(--ion-color-medium); font-size: 13px; }`],
})
export class LaundryPickupRequestSheetComponent {
  private readonly modalCtrl = inject(ModalController);

  protected readonly today = toDateOnlyString(new Date());
  protected readonly tomorrow = toDateOnlyString(new Date(Date.now() + 86_400_000));

  protected readonly form = new FormGroup({
    when: new FormControl(this.today, { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
  });

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected send(): Promise<boolean> {
    const result: LaundryPickupRequestResult = {
      when: this.form.controls.when.value,
      note: this.form.controls.note.value.trim() || null,
    };
    return this.modalCtrl.dismiss(result, 'send');
  }
}
