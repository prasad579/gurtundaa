import { Component, computed, inject, signal } from '@angular/core';
import {
  BILL_CATEGORY_LABELS,
  Bill,
  BillsApi,
  billDueLabel,
  billUrgency,
  rupeeLabel,
} from '@gurtundaa/shared';
import {
  AlertController,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

type FilterKey = 'All' | 'Overdue' | 'DueSoon' | 'Upcoming' | 'Paid';

@Component({
  selector: 'app-bills-all',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonSkeletonText],
  templateUrl: './bills-all.page.html',
  styleUrl: './bills-all.page.scss',
})
export class BillsAllPage implements ViewWillEnter {
  private readonly billsApi = inject(BillsApi);
  private readonly toasts = inject(ToastController);
  private readonly alerts = inject(AlertController);

  protected readonly categoryLabels = BILL_CATEGORY_LABELS;
  protected readonly rupeeLabel = rupeeLabel;
  protected readonly billDueLabel = billDueLabel;

  protected readonly loading = signal(true);
  protected readonly bills = signal<Bill[]>([]);
  protected readonly filter = signal<FilterKey>('All');

  protected readonly counts = computed(() => {
    const all = this.bills();
    return {
      All: all.length,
      Overdue: all.filter((b) => !b.isPaid && billUrgency(b.dueDate) === 'Overdue').length,
      DueSoon: all.filter((b) => !b.isPaid && billUrgency(b.dueDate) === 'DueSoon').length,
      Upcoming: all.filter((b) => !b.isPaid && billUrgency(b.dueDate) === 'Upcoming').length,
      Paid: all.filter((b) => b.isPaid).length,
    };
  });

  protected readonly filtered = computed(() => {
    const f = this.filter();
    const all = [...this.bills()].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (f === 'All') return all;
    if (f === 'Paid') return all.filter((b) => b.isPaid);
    return all.filter((b) => !b.isPaid && billUrgency(b.dueDate) === f);
  });

  ionViewWillEnter(): void {
    void this.load();
  }

  protected setFilter(key: FilterKey): void {
    this.filter.set(key);
  }

  protected urgencyClass(bill: Bill): string {
    if (bill.isPaid) return 'later';
    const u = billUrgency(bill.dueDate);
    return u === 'Overdue' ? 'overdue' : u === 'DueSoon' ? 'due-soon' : 'later';
  }

  protected async markPaid(bill: Bill): Promise<void> {
    if (!bill.isPaid) {
      const alert = await this.alerts.create({
        header: 'Mark as paid?',
        message: `${bill.name} — ${rupeeLabel(bill.amount)}`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Confirm', role: 'confirm' },
        ],
      });
      await alert.present();
      const { role } = await alert.onWillDismiss();
      if (role !== 'confirm') return;
    }
    await firstValueFrom(this.billsApi.setPaid(bill.id, { isPaid: !bill.isPaid }));
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.bills.set(await firstValueFrom(this.billsApi.list()));
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
