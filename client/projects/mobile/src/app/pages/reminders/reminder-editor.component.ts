import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PRIORITY_LABELS, Reminder, ReminderPriority, SaveReminderRequest } from '@gurtundaa/shared';
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
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

/** Bottom-sheet form for adding or editing a reminder. Resolves the modal with a SaveReminderRequest. */
@Component({
  selector: 'app-reminder-editor',
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
    IonTextarea,
    IonLabel,
    IonToggle,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonSegment,
    IonSegmentButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">cancel</ion-button>
        </ion-buttons>
        <ion-title>{{ reminder ? 'edit ✍️' : 'new reminder 💭' }}</ion-title>
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
              formControlName="title"
              label="what are we not forgetting?"
              labelPlacement="stacked"
              placeholder="call amma, pay wifi bill…"
              [maxlength]="200"
            />
          </ion-item>

          <ion-item>
            <ion-toggle formControlName="hasDue">set a time ⏰</ion-toggle>
          </ion-item>

          @if (form.controls.hasDue.value) {
            <ion-item>
              <ion-label>when</ion-label>
              <ion-datetime-button datetime="due-at" />
            </ion-item>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime id="due-at" formControlName="dueAt" presentation="date-time" [min]="minDate" />
              </ng-template>
            </ion-modal>
          }

          <ion-item lines="none" class="priority">
            <ion-label position="stacked">how urgent?</ion-label>
            <ion-segment formControlName="priority">
              @for (p of priorities; track p) {
                <ion-segment-button [value]="p">
                  <ion-label>{{ priorityLabels[p] }}</ion-label>
                </ion-segment-button>
              }
            </ion-segment>
          </ion-item>

          <ion-item>
            <ion-textarea
              formControlName="notes"
              label="notes (optional)"
              labelPlacement="stacked"
              [autoGrow]="true"
              [maxlength]="2000"
            />
          </ion-item>
        </ion-list>
      </form>
    </ion-content>
  `,
  styles: `
    ion-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      background: transparent;
    }
    ion-item {
      --border-radius: 14px;
      --background: var(--ion-color-step-50, rgb(124 58 237 / 0.06));
    }
    .priority ion-segment {
      margin-top: 0.5rem;
      width: 100%;
    }
  `,
})
export class ReminderEditorComponent implements OnInit {
  private readonly modal = inject(ModalController);

  @Input() reminder?: Reminder;

  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly priorities: ReminderPriority[] = ['Chill', 'Normal', 'Urgent'];
  protected readonly minDate = new Date(Date.now() - 365 * 86_400_000).toISOString();

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    notes: new FormControl('', { nonNullable: true }),
    hasDue: new FormControl(true, { nonNullable: true }),
    dueAt: new FormControl(defaultDue(), { nonNullable: true }),
    priority: new FormControl<ReminderPriority>('Normal', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.reminder) {
      this.form.setValue({
        title: this.reminder.title,
        notes: this.reminder.notes ?? '',
        hasDue: !!this.reminder.dueAt,
        dueAt: this.reminder.dueAt ?? defaultDue(),
        priority: this.reminder.priority,
      });
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modal.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveReminderRequest = {
      title: v.title.trim(),
      notes: v.notes.trim() || null,
      dueAt: v.hasDue ? new Date(v.dueAt).toISOString() : null,
      priority: v.priority,
    };
    return this.modal.dismiss(request, 'save');
  }
}

/** Default to the next full hour. ion-datetime wants a local ISO string without offset. */
function defaultDue(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00:00`;
}
