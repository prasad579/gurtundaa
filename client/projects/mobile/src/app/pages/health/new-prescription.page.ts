import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  HouseholdMember,
  HouseholdMembersApi,
  PrescriptionsApi,
  SaveMedicineRequest,
  SavePrescriptionRequest,
  parseDateOnly,
  toDateOnlyString,
} from '@gurtundaa/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, medkit, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { MedicineEditorComponent } from './medicine-editor.component';

const REVISIT_PRESETS: { label: string; days: number }[] = [
  { label: '7 days', days: 7 },
  { label: '15 days', days: 15 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

@Component({
  selector: 'app-new-prescription',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
  ],
  templateUrl: './new-prescription.page.html',
  styleUrl: './new-prescription.page.scss',
})
export class NewPrescriptionPage implements ViewWillEnter {
  private readonly membersApi = inject(HouseholdMembersApi);
  private readonly prescriptionsApi = inject(PrescriptionsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly router = inject(Router);

  protected readonly today = toDateOnlyString(new Date());
  protected readonly revisitPresets = REVISIT_PRESETS;

  protected readonly members = signal<HouseholdMember[]>([]);
  protected readonly memberId = signal('');
  protected readonly doctorName = signal('');
  protected readonly doctorSpecialty = signal('');
  protected readonly visitDate = signal(this.today);
  protected readonly revisitDate = signal<string | null>(null);
  protected readonly medicines = signal<SaveMedicineRequest[]>([]);
  protected readonly saving = signal(false);

  protected readonly selectedMember = computed(() => this.members().find((m) => m.id === this.memberId()));

  protected readonly canSave = computed(
    () => !!this.memberId() && this.doctorName().trim().length > 0 && this.medicines().length > 0,
  );

  constructor() {
    addIcons({ add, trash, medkit });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected onVisitDateChange(value: string): void {
    this.visitDate.set(value);
  }

  protected onRevisitDateChange(value: string): void {
    this.revisitDate.set(value);
  }

  protected selectRevisitPreset(days: number): void {
    const base = parseDateOnly(this.visitDate());
    this.revisitDate.set(toDateOnlyString(new Date(base.getFullYear(), base.getMonth(), base.getDate() + days)));
  }

  protected clearRevisit(): void {
    this.revisitDate.set(null);
  }

  protected async addMedicine(): Promise<void> {
    const member = this.selectedMember();
    if (!member) {
      await this.toast('pick who this is for first', 'danger');
      return;
    }

    const modal = await this.modals.create({
      component: MedicineEditorComponent,
      componentProps: { members: [member], initialMemberId: member.id },
      breakpoints: [0, 0.95, 1],
      initialBreakpoint: 0.95,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<SaveMedicineRequest>();
    if (role !== 'save' || !data) return;
    this.medicines.update((list) => [...list, data]);
  }

  protected removeMedicine(index: number): void {
    this.medicines.update((list) => list.filter((_, i) => i !== index));
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;

    this.saving.set(true);
    try {
      const request: SavePrescriptionRequest = {
        memberId: this.memberId(),
        doctorName: this.doctorName().trim(),
        doctorSpecialty: this.doctorSpecialty().trim() || null,
        visitDate: this.visitDate(),
        revisitDate: this.revisitDate(),
        medicines: this.medicines(),
      };
      await firstValueFrom(this.prescriptionsApi.create(request));
      await this.toast('prescription saved 📋');
      await this.router.navigateByUrl('/health');
    } catch {
      await this.toast("couldn't save, try again", 'danger');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    const members = await firstValueFrom(this.membersApi.list());
    this.members.set(members);
    if (!this.memberId() && members[0]) {
      this.memberId.set(members[0].id);
    }
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
