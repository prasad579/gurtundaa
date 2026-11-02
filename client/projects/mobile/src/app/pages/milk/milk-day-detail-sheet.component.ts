import { Component, Input, OnInit, inject } from '@angular/core';
import { MILK_SLOT_LABELS, MilkExtraRequestItem, MilkSlot, MilkSlotState, isFutureDate, litresLabel, shortDateLabel } from '@gurtundaa/shared';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, checkmark, close, createOutline, logoWhatsapp, pauseOutline, trash } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/** What the caller should do after this sheet closes — it never calls the API itself, so the parent page stays the single place that mutates milk data and reloads. */
export type MilkDayDetailAction =
  | { kind: 'toggleSlot'; slot: MilkSlot }
  | { kind: 'changeQuantity' }
  | { kind: 'pauseFromHere' }
  | { kind: 'editPause' }
  | { kind: 'addExtra' }
  | { kind: 'removeExtra'; extraId: string }
  | { kind: 'notifySlot'; slot: MilkSlot };

interface SlotLine {
  slot: MilkSlot;
  status: MilkSlotState['status'];
  text: string;
  canToggle: boolean;
  toggleLabel: string;
  canNotify: boolean;
  notifyLabel: string;
}

@Component({
  selector: 'app-milk-day-detail-sheet',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, TranslatePipe],
  templateUrl: './milk-day-detail-sheet.component.html',
  styleUrl: './milk-day-detail-sheet.component.scss',
})
export class MilkDayDetailSheetComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly translate = inject(TranslateService);

  @Input({ required: true }) date!: string;
  @Input({ required: true }) statusLabel!: string;
  @Input({ required: true }) morning!: MilkSlotState;
  @Input({ required: true }) evening!: MilkSlotState;
  @Input() extras: MilkExtraRequestItem[] = [];
  @Input() isSelfCollected = false;
  @Input() hasContact = false;
  @Input() isPaused = false;

  protected slotLines: SlotLine[] = [];
  protected isFuture = false;
  protected dateLabel = '';

  constructor() {
    addIcons({ checkmark, close, createOutline, pauseOutline, addOutline, trash, logoWhatsapp });
  }

  ngOnInit(): void {
    this.isFuture = isFutureDate(this.date);
    this.dateLabel = shortDateLabel(this.date);
    this.slotLines = (
      [
        ['Morning', this.morning],
        ['Evening', this.evening],
      ] as const
    )
      .filter(([, state]) => state.enabled)
      .map(([slot, state]) => this.buildSlotLine(slot, state));
  }

  protected extraLine(extra: MilkExtraRequestItem): string {
    return (
      this.translate.instant('milk.extraMilkLabel', { slot: MILK_SLOT_LABELS[extra.slot] }) +
      `: +${litresLabel(extra.quantityLtr)}${extra.reason ? ` (${extra.reason})` : ''}`
    );
  }

  private buildSlotLine(slot: MilkSlot, state: MilkSlotState): SlotLine {
    const label = MILK_SLOT_LABELS[slot];
    const slotIsPlanned = state.status === 'Delivered' && this.isFuture;

    let text: string;
    if (state.status === 'Paused') {
      text = this.translate.instant('milk.slotPaused', { slot: label });
    } else if (state.status === 'Missed') {
      text = this.translate.instant(this.isSelfCollected ? 'milk.slotMissed' : 'milk.slotMissedDelivery', { slot: label });
    } else {
      const verb = this.translate.instant(
        slotIsPlanned ? 'milk.expectedVerb' : this.isSelfCollected ? 'milk.pickedUpLower' : 'milk.deliveredLower',
      );
      text = this.translate.instant('milk.slotStatusQty', { slot: label, verb, qty: litresLabel(state.quantityLtr) });
    }

    const canToggle = state.status !== 'Paused' && !this.isFuture;
    const toggleKey =
      state.status === 'Missed'
        ? this.isSelfCollected
          ? 'milk.markSlotPickedUp'
          : 'milk.markSlotDelivered'
        : this.isSelfCollected
          ? 'milk.markSlotNotPickedUp'
          : 'milk.markSlotMissed';
    const toggleLabel = this.translate.instant(toggleKey, { slot });

    return {
      slot,
      status: state.status,
      text,
      canToggle,
      toggleLabel,
      canNotify: this.hasContact && state.status === 'Missed',
      notifyLabel: this.translate.instant('milk.notifySlot', { slot: label }),
    };
  }

  protected removeExtraLabel(extra: MilkExtraRequestItem): string {
    return this.translate.instant('milk.removeExtraForSlot', { slot: MILK_SLOT_LABELS[extra.slot] });
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected act(action: MilkDayDetailAction): Promise<boolean> {
    return this.modalCtrl.dismiss(action, 'action');
  }
}
