import { AfterViewInit, Component, ElementRef, Input, QueryList, ViewChild, ViewChildren, output } from '@angular/core';
import { MilkCalendarDay, isFutureDate, parseDateOnly, toDateOnlyString } from '@gurtundaa/shared';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark, chevronBack, chevronForward, close, pause } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';

const WEEKDAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// .day-col width (44px) + .strip gap (14px) — kept as a constant so scrollStrip() can page by a
// fixed number of days without measuring the DOM.
const STRIP_DAY_WIDTH = 58;

@Component({
  selector: 'app-milk-calendar',
  imports: [IonIcon, TranslatePipe],
  template: `
    <div class="strip-wrap">
      <button class="strip-nav left" aria-label="scroll to earlier days" (click)="scrollStrip(-1)">
        <ion-icon name="chevron-back" />
      </button>
      <div class="strip" #stripEl>
      @for (day of days; track day.date) {
        <div #dayCol class="day-col" [class.today]="isToday(day.date)" (click)="daySelected.emit(day)">
          <div class="day-label">
            <span class="day-num">{{ dayNumber(day.date) }}</span>
            <span class="day-wd">{{ weekdayAbbrev(day.date) }}</span>
          </div>

          <div class="circle" [class]="cellClass(day)" [class.qty-changed]="isQuantityChanged(day)">
            @switch (cellClass(day)) {
              @case ('missed') {
                <ion-icon name="close" />
              }
              @case ('paused') {
                <ion-icon name="pause" />
              }
              @default {
                @if (cellClass(day) === 'delivered' && !isToday(day.date)) {
                  <ion-icon name="checkmark" />
                }
              }
            }
            @if (day.morning.hasExtra || day.evening.hasExtra) {
              <span class="extra-dot"></span>
            }
          </div>

          <div class="day-sub">
            @if (isToday(day.date) && cellClass(day) !== 'missed' && cellClass(day) !== 'paused') {
              <span class="sub today-tag">{{ 'milk.today' | translate }}</span>
            } @else if (cellClass(day) === 'not-tracked') {
              <span class="sub dim">—</span>
            } @else if (cellClass(day) === 'missed') {
              <span class="sub missed-text">{{ 'milk.missShort' | translate }}</span>
            } @else if (cellClass(day) === 'paused') {
              <span class="sub paused-text">{{ 'milk.paused' | translate }}</span>
            } @else {
              <span class="sub">{{ dayQuantity(day) }}</span>
            }
          </div>
        </div>
      }
      </div>
      <button class="strip-nav right" aria-label="scroll to later days" (click)="scrollStrip(1)">
        <ion-icon name="chevron-forward" />
      </button>
    </div>
    <div class="legend">
      <span class="legend-item"><i class="dot delivered"></i>{{ 'milk.legendDelivered' | translate }}</span>
      <span class="legend-item"><i class="dot planned"></i>{{ 'milk.legendPlanned' | translate }}</span>
      <span class="legend-item"><i class="dot missed"></i>{{ 'milk.legendMissed' | translate }}</span>
      <span class="legend-item"><i class="dot paused"></i>{{ 'milk.legendPaused' | translate }}</span>
      <span class="legend-item"><i class="dot extra"></i>{{ 'milk.legendExtra' | translate }}</span>
      <span class="legend-item"><i class="dot qty-changed"></i>{{ 'milk.legendQtyChanged' | translate }}</span>
      @if (startDate) {
        <span class="legend-item"><i class="dot not-tracked"></i>{{ 'milk.legendNotTracked' | translate }}</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .strip-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .strip {
      display: flex;
      gap: 14px;
      overflow-x: auto;
      padding: 4px 2px 16px;
      scroll-snap-type: x proximity;
      flex: 1;
      min-width: 0;
    }
    .strip::-webkit-scrollbar { height: 0; }
    .strip-nav {
      flex: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1px solid var(--ion-color-step-100, #e8e8e8);
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ion-color-primary, #7c3aed);
      font-size: 15px;
      margin-bottom: 16px;
    }
    .day-col {
      flex: 0 0 auto;
      width: 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      scroll-snap-align: center;
    }
    .day-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
    }
    .day-num { font-size: 13px; font-weight: 700; color: var(--ion-color-dark, #1f1330); }
    .day-wd { font-size: 9.5px; font-weight: 600; color: var(--ion-color-medium); }
    .circle {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      background: var(--ion-color-step-50, rgb(124 58 237 / 0.06));
      color: var(--ion-color-dark, #1f1330);
    }
    // A ring, not a background reset — today still needs to show its real status color (paused/
    // missed/delivered), not just the default "planned" look.
    .day-col.today .circle { box-shadow: 0 0 0 2px var(--ion-color-step-150, #c9c3dd); }
    .circle.delivered { background: #2dd36f; color: #fff; }
    .circle.planned { background: rgb(124 58 237 / 0.16); border: 1.5px solid rgb(124 58 237 / 0.45); color: var(--ion-color-primary, #7c3aed); }
    .circle.missed { background: #eb445a; color: #fff; }
    .circle.paused { background: #ffc409; color: #7a5200; }
    .circle.not-tracked { background: transparent; }
    .circle.delivered.qty-changed { background: #1976d2; }
    .circle.planned.qty-changed { border-color: #1976d2; color: #1976d2; }
    .extra-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--ion-color-secondary, #ec4899);
      border: 2px solid #fff;
    }
    .sub { font-size: 11px; font-weight: 700; color: var(--ion-color-dark, #1f1330); }
    .sub.dim { color: var(--ion-color-medium, #92949c); opacity: 0.55; font-weight: 400; }
    .sub.missed-text { color: #eb445a; }
    .sub.paused-text { color: #b36b00; }
    .sub.today-tag { color: var(--ion-color-medium); font-weight: 600; }
    .legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 2px; }
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
export class MilkCalendarComponent implements AfterViewInit {
  @Input({ required: true }) days: MilkCalendarDay[] = [];
  /** Days before this aren't shown as delivered/missed — tracking simply hadn't started yet. */
  @Input() startDate?: string;
  /** The subscription's normal daily total (morning + evening) — used to flag days that differ. */
  @Input() baseQuantityLtr = 0;

  readonly daySelected = output<MilkCalendarDay>();

  @ViewChildren('dayCol') private readonly dayCols!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('stripEl') private readonly stripEl!: ElementRef<HTMLElement>;

  constructor() {
    addIcons({ checkmark, close, pause, chevronBack, chevronForward });
  }

  ngAfterViewInit(): void {
    // Scroll the strip so today (or day 1, when browsing a different month) starts in view —
    // otherwise a mid-month load leaves the strip sitting at day 1 with today off to the right.
    const index = Math.max(0, this.days.findIndex((d) => this.isToday(d.date)));
    this.dayCols.get(index)?.nativeElement.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  // Lets the day strip be paged a few days at a time via visible buttons — swipe/drag works too,
  // but isn't obvious on desktop since the scrollbar itself is hidden for a cleaner look.
  protected scrollStrip(direction: 1 | -1): void {
    this.stripEl.nativeElement.scrollBy({ left: direction * 4 * STRIP_DAY_WIDTH, behavior: 'smooth' });
  }

  protected dayNumber(date: string): number {
    return parseDateOnly(date).getDate();
  }

  protected weekdayAbbrev(date: string): string {
    return WEEKDAY_ABBREV[parseDateOnly(date).getDay()];
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
