import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DoseEntry,
  DoseLogApi,
  DoseSlot,
  HouseholdMember,
  HouseholdMembersApi,
  Medicine,
  MedicinesApi,
  PrescriptionDto,
  PrescriptionsApi,
  toDateOnlyString,
} from '@gurtundaa/shared';
import {
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
import { add, checkmark, create, documentText, people, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { MedicineEditorComponent } from './medicine-editor.component';
import { MemberEditorComponent } from './member-editor.component';

interface SlotMeta {
  icon: string;
  label: string;
  time: string;
}

const SLOT_ORDER: DoseSlot[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
const SLOT_META: Record<DoseSlot, SlotMeta> = {
  Morning: { icon: '🌅', label: 'Morning', time: '8:00 AM' },
  Afternoon: { icon: '☀️', label: 'Afternoon', time: '1:30 PM' },
  Evening: { icon: '🌇', label: 'Evening', time: '6:00 PM' },
  Night: { icon: '🌙', label: 'Night', time: '9:00 PM' },
};

@Component({
  selector: 'app-health-home',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonSkeletonText],
  templateUrl: './health-home.page.html',
  styleUrl: './health-home.page.scss',
})
export class HealthHomePage implements ViewWillEnter {
  private readonly membersApi = inject(HouseholdMembersApi);
  private readonly medicinesApi = inject(MedicinesApi);
  private readonly doseLogApi = inject(DoseLogApi);
  private readonly prescriptionsApi = inject(PrescriptionsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly alerts = inject(AlertController);
  private readonly router = inject(Router);

  protected readonly slotOrder = SLOT_ORDER;
  protected readonly slotMeta = SLOT_META;

  protected readonly loading = signal(true);
  protected readonly members = signal<HouseholdMember[]>([]);
  protected readonly medicines = signal<Medicine[]>([]);
  protected readonly doses = signal<DoseEntry[]>([]);
  protected readonly prescriptions = signal<PrescriptionDto[]>([]);

  protected readonly lowStock = computed(() =>
    this.medicines().filter((m) => m.isActive && m.perDayQty > 0 && m.daysRemaining <= 2),
  );

  protected readonly dosesBySlot = computed(() => {
    const groups: Record<DoseSlot, DoseEntry[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] };
    for (const d of this.doses()) {
      groups[d.slot].push(d);
    }
    return groups;
  });

  constructor() {
    addIcons({ add, checkmark, create, trash, people, documentText });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected goToNewPrescription(): void {
    void this.router.navigateByUrl('/new-prescription');
  }

  protected async removePrescription(prescription: PrescriptionDto): Promise<void> {
    if (!(await this.confirmDelete(`Remove this prescription from ${prescription.doctorName}? Its medicines stay, just unlinked.`))) return;
    await firstValueFrom(this.prescriptionsApi.delete(prescription.id));
    await this.toast('prescription removed');
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
    await this.toast(member ? 'member updated ✍️' : 'family member added 🧑');
    await this.load();
  }

  protected async removeMember(member: HouseholdMember): Promise<void> {
    if (!(await this.confirmDelete(`Remove ${member.name} and all their medicines?`))) return;
    await firstValueFrom(this.membersApi.delete(member.id));
    await this.toast('member removed');
    await this.load();
  }

  protected async openMedicineEditor(medicine?: Medicine): Promise<void> {
    if (this.members().length === 0) {
      await this.toast('add a family member first', 'danger');
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
    await this.toast(medicine ? 'medicine updated ✍️' : 'medicine added 💊');
    await this.load();
  }

  protected async removeMedicine(medicine: Medicine): Promise<void> {
    if (!(await this.confirmDelete(`Stop tracking ${medicine.name}?`))) return;
    await firstValueFrom(this.medicinesApi.delete(medicine.id));
    await this.toast('medicine removed');
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
    } catch {
      await this.toast("can't reach the server rn 😵‍💫", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  private async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alerts.create({
      header: 'Delete?',
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive' },
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
