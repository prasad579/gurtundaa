import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FoodTiming,
  HouseholdMember,
  Medicine,
  MedicineMode,
  SaveMedicineRequest,
  parseDateOnly,
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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

type SlotControl = 'morningQty' | 'afternoonQty' | 'eveningQty' | 'nightQty';

@Component({
  selector: 'app-medicine-editor',
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
    IonSelect,
    IonSelectOption,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    TranslatePipe,
  ],
  templateUrl: './medicine-editor.component.html',
  styleUrl: './medicine-editor.component.scss',
})
export class MedicineEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() medicine?: Medicine;
  @Input() members: HouseholdMember[] = [];
  @Input() initialMemberId?: string;

  protected readonly today = toDateOnlyString(new Date());

  protected readonly form = new FormGroup({
    memberId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    purpose: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    mode: new FormControl<MedicineMode>('Daily', { nonNullable: true }),
    courseDays: new FormControl(10, { nonNullable: true }),
    morningQty: new FormControl(1, { nonNullable: true }),
    afternoonQty: new FormControl(0, { nonNullable: true }),
    eveningQty: new FormControl(0, { nonNullable: true }),
    nightQty: new FormControl(0, { nonNullable: true }),
    foodTiming: new FormControl<FoodTiming>('AnyTime', { nonNullable: true }),
    stockCount: new FormControl(30, { nonNullable: true }),
    startDate: new FormControl(this.today, { nonNullable: true, validators: [Validators.required] }),
    nextVisitDate: new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    if (this.medicine) {
      const m = this.medicine;
      this.form.setValue({
        memberId: m.memberId,
        name: m.name,
        purpose: m.purpose ?? '',
        mode: m.mode,
        courseDays: m.courseDays ?? 10,
        morningQty: m.morningQty,
        afternoonQty: m.afternoonQty,
        eveningQty: m.eveningQty,
        nightQty: m.nightQty,
        foodTiming: m.foodTiming,
        stockCount: m.stockCount,
        startDate: m.startDate,
        nextVisitDate: m.nextVisitDate,
      });
    } else if (this.initialMemberId) {
      this.form.controls.memberId.setValue(this.initialMemberId);
    } else if (this.members[0]) {
      this.form.controls.memberId.setValue(this.members[0].id);
    }
  }

  protected adjustSlot(control: SlotControl, delta: number): void {
    const c = this.form.controls[control];
    c.setValue(Math.min(4, Math.max(0, c.value + delta)));
  }

  protected adjustStock(delta: number): void {
    const c = this.form.controls.stockCount;
    c.setValue(Math.max(0, c.value + delta));
  }

  protected adjustCourseDays(delta: number): void {
    const c = this.form.controls.courseDays;
    c.setValue(Math.max(1, c.value + delta));
  }

  protected perDayQty(): number {
    const v = this.form.getRawValue();
    return v.morningQty + v.afternoonQty + v.eveningQty + v.nightQty;
  }

  // Mirrors MedicineService.Plan() server-side exactly, for instant feedback before saving.
  protected plan(): { days: number; last: string | null; remind: string } {
    const perDay = this.perDayQty();
    const v = this.form.getRawValue();
    const start = v.startDate > this.today ? v.startDate : this.today;
    if (perDay <= 0) {
      return { days: 0, last: null, remind: start };
    }

    const stock = v.stockCount;
    const days = Math.floor(stock / perDay);
    const last = days > 0 ? addDays(start, days - 1) : null;
    const k = Math.max(0, Math.ceil((stock - 2 * perDay) / perDay));
    return { days, last, remind: addDays(start, k) };
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveMedicineRequest = {
      memberId: v.memberId,
      name: v.name.trim(),
      purpose: v.purpose.trim() || null,
      mode: v.mode,
      courseDays: v.mode === 'Course' ? v.courseDays : null,
      morningQty: v.morningQty,
      afternoonQty: v.afternoonQty,
      eveningQty: v.eveningQty,
      nightQty: v.nightQty,
      foodTiming: v.foodTiming,
      stockCount: v.stockCount,
      startDate: v.startDate,
      nextVisitDate: v.nextVisitDate,
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}

function addDays(dateOnly: string, n: number): string {
  const d = parseDateOnly(dateOnly);
  return toDateOnlyString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}
