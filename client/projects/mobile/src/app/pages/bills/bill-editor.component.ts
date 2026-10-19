import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BILL_CATEGORY_LABELS,
  Bill,
  BillCategory,
  BillRecurrence,
  ParsedBillMessage,
  SaveBillRequest,
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
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

@Component({
  selector: 'app-bill-editor',
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
    IonSegment,
    IonSegmentButton,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonTextarea,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">cancel</ion-button></ion-buttons>
        <ion-title>{{ bill ? 'edit bill' : 'new bill 🧾' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <h3 class="section-title">Category</h3>
        <div class="cat-grid">
          @for (cat of categories; track cat.key) {
            <div class="cat-chip" [class.sel]="category() === cat.key" (click)="category.set(cat.key)">
              <span class="ic">{{ cat.icon }}</span>
              {{ cat.label }}
            </div>
          }
        </div>

        <ion-list lines="none">
          <ion-item>
            <ion-input
              formControlName="name"
              label="name / provider"
              labelPlacement="stacked"
              placeholder="e.g. TSSPDCL, Netflix…"
              [maxlength]="100"
            />
          </ion-item>
          <ion-item>
            <ion-input
              formControlName="amount"
              type="number"
              inputmode="decimal"
              label="amount (₹)"
              labelPlacement="stacked"
              placeholder="0"
            />
          </ion-item>
          <ion-item>
            <ion-label>due date</ion-label>
            <ion-datetime-button datetime="due-date" />
          </ion-item>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="due-date" formControlName="dueDate" presentation="date" />
            </ng-template>
          </ion-modal>
        </ion-list>

        <h3 class="section-title">Repeats</h3>
        <ion-segment [value]="form.controls.recurrence.value" (ionChange)="form.controls.recurrence.setValue($any($event.detail.value))">
          <ion-segment-button value="OneTime">One-time</ion-segment-button>
          <ion-segment-button value="Monthly">Monthly</ion-segment-button>
          <ion-segment-button value="Quarterly">Quarterly</ion-segment-button>
          <ion-segment-button value="Yearly">Yearly</ion-segment-button>
        </ion-segment>

        <ion-list lines="none">
          <ion-item>
            <ion-input
              formControlName="reminderLeadDays"
              type="number"
              inputmode="numeric"
              label="remind me (days before due date)"
              labelPlacement="stacked"
              placeholder="3"
            />
          </ion-item>
          <ion-item>
            <ion-textarea
              formControlName="notes"
              label="notes (optional)"
              labelPlacement="stacked"
              placeholder="account number, policy number…"
              [autoGrow]="true"
              [maxlength]="200"
            />
          </ion-item>
        </ion-list>

        @if (form.controls.recurrence.value !== 'OneTime') {
          <p class="hint">
            Once you mark this paid, it'll roll forward to the next due date on its own — no need to re-enter it
            every cycle unless the amount changes.
          </p>
        }
      </form>
    </ion-content>
  `,
  styles: `
    .section-title { margin: 18px 4px 8px; font-size: 13px; font-weight: 800; }
    .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
    .cat-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 4px;
      border-radius: 12px;
      background: var(--ion-color-step-50, rgb(124 58 237 / 0.06));
      border: 1.5px solid transparent;
      font-size: 9.5px;
      font-weight: 600;
      color: var(--ion-color-medium-shade, #5a4e75);
      text-align: center;

      &.sel { border-color: var(--ion-color-primary, #7c3aed); background: rgb(124 58 237 / 0.12); color: var(--ion-color-primary, #7c3aed); }
      .ic { font-size: 18px; }
    }
    .hint { font-size: 11px; color: var(--ion-color-medium); margin: 10px 4px 0; }
  `,
})
export class BillEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() bill?: Bill;
  /** Prefills a new bill from a parsed paste-message — ignored when editing an existing bill. */
  @Input() prefill?: ParsedBillMessage;

  protected readonly categories = (Object.entries(BILL_CATEGORY_LABELS) as [BillCategory, { icon: string; label: string }][]).map(
    ([key, v]) => ({ key, ...v }),
  );
  protected readonly category = signal<BillCategory>('Electricity');

  protected readonly today = toDateOnlyString(new Date());

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    dueDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    recurrence: new FormControl<BillRecurrence>('Monthly', { nonNullable: true }),
    reminderLeadDays: new FormControl(3, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(30)] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.bill) {
      this.category.set(this.bill.category);
      this.form.setValue({
        name: this.bill.name,
        amount: this.bill.amount,
        dueDate: this.bill.dueDate,
        recurrence: this.bill.recurrence,
        reminderLeadDays: this.bill.reminderLeadDays,
        notes: this.bill.notes ?? '',
      });
    } else if (this.prefill) {
      this.category.set(this.prefill.category);
      this.form.patchValue({
        name: this.prefill.name ?? '',
        amount: this.prefill.amount ?? 0,
        dueDate: this.prefill.dueDate ?? this.today,
      });
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveBillRequest = {
      category: this.category(),
      name: v.name.trim(),
      amount: Number(v.amount),
      dueDate: v.dueDate,
      recurrence: v.recurrence,
      reminderLeadDays: Number(v.reminderLeadDays),
      notes: v.notes.trim() || null,
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
