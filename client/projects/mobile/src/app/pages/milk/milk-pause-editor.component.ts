import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MilkPause, SaveMilkPauseRequest, toDateOnlyString } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
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
  selector: 'app-milk-pause-editor',
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
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonTextarea,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>{{ pause ? 'edit pause' : 'pause delivery 🧳' }}</ion-title>
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
            <ion-datetime-button datetime="pause-start" />
          </ion-item>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="pause-start" formControlName="startDate" presentation="date" [min]="today" />
            </ng-template>
          </ion-modal>

          <ion-item>
            <ion-label>to</ion-label>
            <ion-datetime-button datetime="pause-end" />
          </ion-item>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="pause-end" formControlName="endDate" presentation="date" [min]="form.controls.startDate.value" />
            </ng-template>
          </ion-modal>

          <ion-item>
            <ion-textarea
              formControlName="reason"
              label="reason (optional)"
              labelPlacement="stacked"
              placeholder="out of station, visiting family…"
              [autoGrow]="true"
              [maxlength]="200"
            />
          </ion-item>
        </ion-list>
      </form>
    </ion-content>
  `,
})
export class MilkPauseEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() pause?: MilkPause;

  protected readonly today = toDateOnlyString(new Date());

  protected readonly form = new FormGroup({
    startDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.pause) {
      this.form.setValue({
        startDate: this.pause.startDate,
        endDate: this.pause.endDate,
        reason: this.pause.reason ?? '',
      });
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveMilkPauseRequest = {
      startDate: v.startDate,
      endDate: v.endDate,
      reason: v.reason.trim() || null,
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
