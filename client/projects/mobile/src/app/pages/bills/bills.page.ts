import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  BILL_CATEGORY_LABELS,
  Bill,
  BillsApi,
  SaveBillRequest,
  billDueLabel,
  billUrgency,
  rupeeLabel,
} from '@gurtundaa/shared';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmarkDoneOutline, chevronForward, createOutline, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { BillNotifications } from '../../services/bill-notifications';
import { BillEditorComponent } from './bill-editor.component';

const VISIBLE_PER_SECTION = 2;

@Component({
  selector: 'app-bills',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonSkeletonText],
  templateUrl: './bills.page.html',
  styleUrl: './bills.page.scss',
})
export class BillsPage implements ViewWillEnter {
  private readonly billsApi = inject(BillsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly alerts = inject(AlertController);
  private readonly notifications = inject(BillNotifications);
  private readonly router = inject(Router);

  protected readonly categoryLabels = BILL_CATEGORY_LABELS;
  protected readonly rupeeLabel = rupeeLabel;
  protected readonly billDueLabel = billDueLabel;
  protected readonly visiblePerSection = VISIBLE_PER_SECTION;

  protected readonly loading = signal(true);
  protected readonly bills = signal<Bill[]>([]);

  protected readonly overdue = computed(() => this.bills().filter((b) => !b.isPaid && billUrgency(b.dueDate) === 'Overdue'));
  protected readonly dueSoon = computed(() => this.bills().filter((b) => !b.isPaid && billUrgency(b.dueDate) === 'DueSoon'));
  protected readonly upcoming = computed(() => this.bills().filter((b) => !b.isPaid && billUrgency(b.dueDate) === 'Upcoming'));
  protected readonly paidThisMonth = computed(() => {
    const now = new Date();
    return this.bills().filter((b) => {
      if (!b.isPaid || !b.paidAt) return false;
      const paid = new Date(b.paidAt);
      return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
    });
  });

  protected readonly totalDue = computed(() => [...this.overdue(), ...this.dueSoon(), ...this.upcoming()].reduce((sum, b) => sum + b.amount, 0));

  constructor() {
    addIcons({ add, checkmarkDoneOutline, chevronForward, createOutline, trash });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected async openEditor(bill?: Bill): Promise<void> {
    const modal = await this.modals.create({
      component: BillEditorComponent,
      componentProps: { bill },
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveBillRequest>();
    if (role !== 'save' || !data) return;

    await firstValueFrom(bill ? this.billsApi.update(bill.id, data) : this.billsApi.create(data));
    await this.toast(bill ? 'bill updated' : 'bill added 🧾');
    await this.load();
  }

  protected async markPaid(bill: Bill): Promise<void> {
    if (!(await this.confirm('Mark as paid?', `${bill.name} — ${rupeeLabel(bill.amount)}`))) return;
    await firstValueFrom(this.billsApi.setPaid(bill.id, { isPaid: true }));
    await this.toast('marked as paid ✅');
    await this.load();
  }

  protected async remove(bill: Bill): Promise<void> {
    if (!(await this.confirm('Delete this bill?', bill.name))) return;
    await firstValueFrom(this.billsApi.delete(bill.id));
    await this.toast('bill removed');
    await this.load();
  }

  private async confirm(header: string, message: string): Promise<boolean> {
    const alert = await this.alerts.create({
      header,
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Confirm', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onWillDismiss();
    return role === 'confirm';
  }

  protected viewAll(): void {
    void this.router.navigateByUrl('/bills/all');
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const bills = await firstValueFrom(this.billsApi.list());
      this.bills.set(bills);
      void this.notifications.sync(bills);
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
