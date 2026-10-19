import { Component, Input, output } from '@angular/core';
import { MilkCalendarDay, isFutureDate, parseDateOnly, toDateOnlyString } from '@gurtundaa/shared';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark, close, pause } from 'ionicons/icons';

@Component({
  selector: 'app-milk-calendar',
  imports: [IonIcon],
  template: `
    <div class="weekdays">
      @for (d of weekdays; track $index) {
        <span>{{ d }}</span>
      }
    </div>
    <div class="grid">
      @for (b of leadingBlanks; track $index) {
        <div class="cell blank"></div>
      }
      @for (day of days; track day.date) {
        <div class="cell" [class.today]="isToday(day.date)" (click)="daySelected.emit(day)">
          <div class="circle" [class]="cellClass(day)" [class.qty-changed]="isQuantityChanged(day)">
            @switch (cellClass(day)) {
              @case ('delivered') {
                <ion-icon name="checkmark" />
              }
              @case ('missed') {
                <ion-icon name="close" />
              }
              @case ('paused') {
                <ion-icon name="pause" />
              }
              @case ('not-tracked') {
                <span class="num dim">{{ dayNumber(day.date) }}</span>
              }
              @default {
                <span class="num">{{ dayNumber(day.date) }}</span>
              }
            }
          </div>
          @if (day.morning.hasExtra || day.evening.hasExtra) {
            <span class="extra-dot"></span>
          }
          @if (isQuantityChanged(day)) {
            <span class="qty-tag">{{ dayQuantity(day) }}L</span>
          }
        </div>
      }
    </div>
    <div class="legend">
      <span class="legend-item"><i class="dot delivered"></i>delivered</span>
      <span class="legend-item"><i class="dot planned"></i>planned</span>
      <span class="legend-item"><i class="dot missed"></i>missed</span>
      <span class="legend-item"><i class="dot paused"></i>paused</span>
      <span class="legend-item"><i class="dot extra"></i>extra</span>
      <span class="legend-item"><i class="dot qty-changed"></i>qty changed</span>
      @if (startDate) {
        <span class="legend-item"><i class="dot not-tracked"></i>not tracked yet</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .grid { display: grid; grid-template-columns: repeat(7, 1fr); column-gap: 4px; row-gap: 10px; }
    .weekdays span { text-align: center; font-size: 10.5px; font-weight: 700; color: var(--ion-color-medium); padding-bottom: 4px; }
    .cell {
      position: relative;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .cell.blank { cursor: default; }
    .cell.today .circle { box-shadow: 0 0 0 2px var(--ion-color-primary, #7c3aed); }
    .circle {
      width: 78%;
      height: 78%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      background: var(--ion-color-step-50, rgb(124 58 237 / 0.06));
      color: var(--ion-color-dark, #1f1330);
    }
    .circle.delivered { background: #2dd36f; color: #fff; }
    .circle.planned { background: #fff; border: 1.5px solid rgb(124 58 237 / 0.35); color: var(--ion-color-primary, #7c3aed); }
    .circle.missed { background: #eb445a; color: #fff; }
    .circle.paused { background: #ffc409; color: #7a5200; }
    .circle.not-tracked { background: transparent; }
    .circle.delivered.qty-changed { background: #1976d2; }
    .circle.planned.qty-changed { border-color: #1976d2; color: #1976d2; }
    .num.dim { color: var(--ion-color-medium, #92949c); opacity: 0.55; }
    .extra-dot {
      position: absolute;
      bottom: 1px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--ion-color-secondary, #ec4899);
    }
    .qty-tag {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 7px;
      font-weight: 800;
      line-height: 1;
      color: #fff;
      background: #1976d2;
      border-radius: 5px;
      padding: 1.5px 3px;
      white-space: nowrap;
    }
    .legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--ion-color-medium); }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot.delivered { background: #2dd36f; }
    .dot.planned { background: var(--ion-color-primary, #7c3aed); }
    .dot.missed { background: #eb445a; }
    .dot.paused { background: #ffc409; }
    .dot.extra { background: var(--ion-color-secondary, #ec4899); }
    .dot.not-tracked { background: var(--ion-color-medium, #92949c); opacity: 0.55; }
    .dot.qty-changed { background: #1976d2; }
  `,
})
export class MilkCalendarComponent {
  @Input({ required: true }) days: MilkCalendarDay[] = [];
  /** Days before this aren't shown as delivered/missed — tracking simply hadn't started yet. */
  @Input() startDate?: string;
  /** The subscription's normal daily total (morning + evening) — used to flag days that differ. */
  @Input() baseQuantityLtr = 0;

  readonly daySelected = output<MilkCalendarDay>();

  protected readonly weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  constructor() {
    addIcons({ checkmark, close, pause });
  }

  protected get leadingBlanks(): number[] {
    if (this.days.length === 0) {
      return [];
    }
    return Array.from({ length: parseDateOnly(this.days[0].date).getDay() });
  }

  protected dayNumber(date: string): number {
    return parseDateOnly(date).getDate();
  }

  protected isToday(date: string): boolean {
    return date === toDateOnlyString(new Date());
  }

  protected dayQuantity(day: MilkCalendarDay): number {
    return (day.morning.enabled ? day.morning.quantityLtr : 0) + (day.evening.enabled ? day.evening.quantityLtr : 0);
  }

  // Flags days where the resolved quantity (from a quantity-change range or a one-off override)
  // differs from the subscription's normal daily total — so a changed week stands out on the
  // calendar itself instead of requiring a tap to discover.
  protected isQuantityChanged(day: MilkCalendarDay): boolean {
    const cls = this.cellClass(day);
    if (cls !== 'delivered' && cls !== 'planned') return false;
    return this.dayQuantity(day) !== this.baseQuantityLtr;
  }

  // "Delivered" is the default projection for any non-paused, non-missed day — including ones
  // that haven't happened yet. Visually that should read as "planned" until the day actually
  // arrives, then flip to "delivered" on its own the next time this list is fetched.
  protected cellClass(day: MilkCalendarDay): string {
    if (this.startDate && day.date < this.startDate) {
      return 'not-tracked';
    }
    if (day.status === 'Delivered' && isFutureDate(day.date)) {
      return 'planned';
    }
    return day.status.toLowerCase();
  }
}
