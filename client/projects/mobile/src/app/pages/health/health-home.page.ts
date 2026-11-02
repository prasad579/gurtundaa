import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DoseEntry,
  DoseLogApi,
  DoseSlot,
  HouseholdMember,
  HouseholdMembersApi,
  MarketplaceApi,
  Medicine,
  MedicinesApi,
  PrescriptionDto,
  PrescriptionsApi,
  QuotationRequest,
  nextVisitAlerts,
  toDateOnlyString,
  visitDueLabel,
} from '@gurtundaa/shared';
import {
  ActionSheetController,
  AlertController,
  IonButton,
  IonButtons,
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
import { add, checkmark, create, documentText, pauseCircleOutline, people, playCircleOutline, storefront, trash } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { HealthVisitNotifications } from '../../services/health-visit-notifications';
import { MarketplaceCart } from '../../services/marketplace-cart';
import { MedicineEditorComponent } from './medicine-editor.component';
import { MemberEditorComponent } from './member-editor.component';

interface SlotMeta {
  icon: string;
  labelKey: string;
  time: string;
}

const SLOT_ORDER: DoseSlot[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
const SLOT_META: Record<DoseSlot, SlotMeta> = {
  Morning: { icon: '🌅', labelKey: 'medicineEditor.morning', time: '8:00 AM' },
  Afternoon: { icon: '☀️', labelKey: 'medicineEditor.afternoon', time: '1:30 PM' },
  Evening: { icon: '🌇', labelKey: 'medicineEditor.evening', time: '6:00 PM' },
  Night: { icon: '🌙', labelKey: 'medicineEditor.night', time: '9:00 PM' },
};

@Component({
  selector: 'app-health-home',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonSkeletonText,
    TranslatePipe,
  ],
  templateUrl: './health-home.page.html',
  styleUrl: './health-home.page.scss',
})
export class HealthHomePage implements ViewWillEnter {
  private readonly membersApi = inject(HouseholdMembersApi);
  private readonly medicinesApi = inject(MedicinesApi);
  private readonly doseLogApi = inject(DoseLogApi);
  private readonly prescriptionsApi = inject(PrescriptionsApi);
  private readonly notifications = inject(HealthVisitNotifications);
  private readonly marketplace = inject(MarketplaceApi);
  private readonly cart = inject(MarketplaceCart);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly alerts = inject(AlertController);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly slotOrder = SLOT_ORDER;
  protected readonly slotMeta = SLOT_META;

  protected readonly loading = signal(true);
  protected readonly members = signal<HouseholdMember[]>([]);
  protected readonly medicines = signal<Medicine[]>([]);
  protected readonly doses = signal<DoseEntry[]>([]);
  protected readonly prescriptions = signal<PrescriptionDto[]>([]);
  protected readonly selectedMemberId = signal<string | null>(null);
  protected readonly pharmacyOrders = signal<QuotationRequest[]>([]);

  protected readonly lowStock = computed(() =>
    this.medicines().filter((m) => m.isActive && m.perDayQty > 0 && m.daysRemaining <= 2),
  );

  protected readonly upcomingVisits = computed(() => nextVisitAlerts(this.medicines(), this.prescriptions()));
  protected readonly visitDueLabel = visitDueLabel;

  protected readonly filteredMedicines = computed(() => {
    const id = this.selectedMemberId();
    return id ? this.medicines().filter((m) => m.memberId === id) : this.medicines();
  });

  protected readonly filteredPrescriptions = computed(() => {
    const id = this.selectedMemberId();
    return id ? this.prescriptions().filter((p) => p.memberId === id) : this.prescriptions();
  });

  // Answers "how many tablets/day does this person take?" — only meaningful once a member is
  // selected (for "All" it'd just be a mix of different people's doses, not a useful total).
  protected readonly selectedMemberSummary = computed(() => {
    const id = this.selectedMemberId();
    if (!id) return null;
    const active = this.medicines().filter((m) => m.memberId === id && m.isActive);
    return { medicineCount: active.length, totalPerDay: active.reduce((sum, m) => sum + m.perDayQty, 0) };
  });

  protected readonly dosesBySlot = computed(() => {
    const groups: Record<DoseSlot, DoseEntry[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] };
    const id = this.selectedMemberId();
    for (const d of this.doses()) {
      if (id && d.memberId !== id) continue;
      groups[d.slot].push(d);
    }
    return groups;
  });

  protected readonly filteredDoseCount = computed(() => Object.values(this.dosesBySlot()).reduce((sum, list) => sum + list.length, 0));

  constructor() {
    addIcons({ add, checkmark, create, trash, people, documentText, pauseCircleOutline, playCircleOutline, storefront });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected selectMember(member: HouseholdMember): void {
    this.selectedMemberId.update((id) => (id === member.id ? null : member.id));
  }

  protected goToNewPrescription(): void {
    void this.router.navigateByUrl('/new-prescription');
  }

  protected async openRefillOptions(medicine: Medicine): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: `Refill ${medicine.name}`,
      buttons: [
        { text: 'I refilled it myself', icon: 'create', handler: () => this.openMedicineEditor(medicine) },
        { text: 'Request from a pharmacy', icon: 'storefront', handler: () => this.requestFromPharmacy(medicine) },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected requestFromPharmacy(medicine: Medicine): void {
    this.cart.addAdHocItem(`medical:${medicine.id}`, medicine.name, 1, 'as prescribed');
    void this.router.navigateByUrl('/marketplace/cart');
  }

  protected pharmacyOrderSummary(request: QuotationRequest): string {
    return request.items.map((i) => i.name).join(', ');
  }

  protected openPharmacyOrder(request: QuotationRequest): void {
    void this.router.navigateByUrl(`/marketplace/requests/${request.id}`);
  }

  protected lowStockLine(m: Medicine): string {
    return this.translate.instant(m.daysRemaining === 1 ? 'health.lowStockOne' : 'health.lowStockMany', {
      name: m.name,
      days: m.daysRemaining,
    });
  }

  protected tabsLabel(qty: number): string {
    return this.translate.instant(qty === 1 ? 'health.tabOne' : 'health.tabMany', { qty });
  }

  protected prescriptionSummary(p: PrescriptionDto): string {
    const base = this.translate.instant(p.medicines.length === 1 ? 'health.medicineOne' : 'health.medicineMany', {
      count: p.medicines.length,
    });
    const revisit = p.revisitDate ? this.translate.instant('health.revisitSuffix', { date: p.revisitDate }) : '';
    return `${p.visitDate} · ${base}${revisit}`;
  }

  protected refillLabel(m: Medicine): string {
    if (m.daysRemaining <= 2) return this.translate.instant('health.refillNow');
    return m.refillReminderDate ? this.translate.instant('health.refillOn', { date: m.refillReminderDate }) : '';
  }

  protected async removePrescription(prescription: PrescriptionDto): Promise<void> {
    if (!(await this.confirmDelete(this.translate.instant('health.removePrescriptionConfirm', { doctor: prescription.doctorName }))))
      return;
    await firstValueFrom(this.prescriptionsApi.delete(prescription.id));
    await this.toast(this.translate.instant('health.toastPrescriptionRemoved'));
    await this.load();
  }

  protected slotDoneCount(slot: DoseSlot): { done: number; total: number } {
    const entries = this.dosesBySlot()[slot];
    return { done: entries.filter((e) => e.status === 'Taken').length, total: entries.length };
  }

  protected async toggleDose(dose: DoseEntry): Promise<void> {
    const today = toDateOnlyString(new Date());
    const nextStatus = dose.status === 'Taken' ? null : 'Taken';
    await firstValueFrom(this.doseLogApi.setStatus(dose.medicineId, today, dose.slot, { status: nextStatus }));
    await this.load();
  }

  protected async openMemberEditor(member?: HouseholdMember): Promise<void> {
    const modal = await this.modals.create({
      component: MemberEditorComponent,
      componentProps: { member },
      breakpoints: [0, 0.6, 1],
      initialBreakpoint: 0.6,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    await firstValueFrom(member ? this.membersApi.update(member.id, data) : this.membersApi.create(data));
    await this.toast(this.translate.instant(member ? 'health.toastMemberUpdated' : 'health.toastMemberAdded'));
    await this.load();
  }

  protected async removeMember(member: HouseholdMember): Promise<void> {
    if (!(await this.confirmDelete(this.translate.instant('health.removeMemberConfirm', { name: member.name })))) return;
    await firstValueFrom(this.membersApi.delete(member.id));
    await this.toast(this.translate.instant('health.toastMemberRemoved'));
    await this.load();
  }

  protected async openMedicineEditor(medicine?: Medicine): Promise<void> {
    if (this.members().length === 0) {
      await this.toast(this.translate.instant('health.toastAddMemberFirst'), 'danger');
      return;
    }

    const modal = await this.modals.create({
      component: MedicineEditorComponent,
      componentProps: { medicine, members: this.members() },
      breakpoints: [0, 0.95, 1],
      initialBreakpoint: 0.95,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    await firstValueFrom(medicine ? this.medicinesApi.update(medicine.id, data) : this.medicinesApi.create(data));
    await this.toast(this.translate.instant(medicine ? 'health.toastMedicineUpdated' : 'health.toastMedicineAdded'));
    await this.load();
  }

  protected async toggleActive(medicine: Medicine): Promise<void> {
    await firstValueFrom(this.medicinesApi.setActive(medicine.id, !medicine.isActive));
    await this.toast(this.translate.instant(medicine.isActive ? 'health.toastMedicineStopped' : 'health.toastMedicineResumed'));
    await this.load();
  }

  protected async removeMedicine(medicine: Medicine): Promise<void> {
    if (!(await this.confirmDelete(this.translate.instant('health.removeMedicineConfirm', { name: medicine.name })))) return;
    await firstValueFrom(this.medicinesApi.delete(medicine.id));
    await this.toast(this.translate.instant('health.toastMedicineRemoved'));
    await this.load();
  }

  protected async pullToRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [members, medicines, doses, prescriptions] = await Promise.all([
        firstValueFrom(this.membersApi.list()),
        firstValueFrom(this.medicinesApi.list()),
        firstValueFrom(this.doseLogApi.getToday()),
        firstValueFrom(this.prescriptionsApi.list()),
      ]);
      this.members.set(members);
      this.medicines.set(medicines);
      this.doses.set(doses);
      this.prescriptions.set(prescriptions);
      void this.notifications.sync(this.upcomingVisits());
      firstValueFrom(this.marketplace.list())
        .then((requests) => this.pharmacyOrders.set(requests.filter((r) => r.items.some((i) => i.itemKey.startsWith('medical:')))))
        .catch(() => undefined);
    } catch {
      await this.toast(this.translate.instant('health.toastServerError'), 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alerts.create({
      header: this.translate.instant('health.deleteConfirmTitle'),
      message,
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('health.deleteBtn'), role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onWillDismiss();
    return role === 'destructive';
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
