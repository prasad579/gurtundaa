import { Component, inject, signal } from '@angular/core';
import { ServiceContact, ServiceContactCategory, ServiceContactsApi } from '@gurtundaa/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, callOutline, link, logoWhatsapp, pencil, star, starOutline, trash } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { CONTACT_CATEGORY_OPTIONS, ContactEditorComponent } from './contact-editor.component';
import { InviteProviderComponent } from './invite-provider.component';

@Component({
  selector: 'app-contacts',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
  ],
  templateUrl: './contacts.page.html',
  styleUrl: './contacts.page.scss',
})
export class ContactsPage implements ViewWillEnter {
  private readonly contacts = inject(ServiceContactsApi);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);

  protected readonly categories = CONTACT_CATEGORY_OPTIONS;
  protected readonly loading = signal(true);
  protected readonly byCategory = signal<Partial<Record<ServiceContactCategory, ServiceContact[]>>>({});

  constructor() {
    addIcons({ add, callOutline, logoWhatsapp, pencil, trash, star, starOutline, link });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected telLink(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  protected waLink(phone: string): string {
    return `https://wa.me/${phone.replace(/\D/g, '')}`;
  }

  protected async openEditor(category: ServiceContactCategory, contact?: ServiceContact, sliding?: IonItemSliding): Promise<void> {
    await sliding?.close();
    const modal = await this.modals.create({
      component: ContactEditorComponent,
      componentProps: { contact, defaultCategory: category },
      breakpoints: [0, 0.9, 1],
      initialBreakpoint: 0.9,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'save' || !data) return;

    await firstValueFrom(contact ? this.contacts.update(contact.id, data) : this.contacts.create(data));
    await this.toast(contact ? 'contact updated' : 'contact added');
    await this.load();
  }

  protected async openInvite(contact: ServiceContact, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    const modal = await this.modals.create({ component: InviteProviderComponent, componentProps: { contact } });
    await modal.present();
  }

  protected async setDefault(contact: ServiceContact, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    await firstValueFrom(this.contacts.setDefault(contact.id));
    await this.toast('set as default');
    await this.load();
  }

  protected async remove(contact: ServiceContact, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    await firstValueFrom(this.contacts.delete(contact.id));
    await this.toast('contact removed');
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const entries = await Promise.all(
        this.categories.map(async (c) => [c.value, await firstValueFrom(this.contacts.list(c.value))] as const),
      );
      this.byCategory.set(Object.fromEntries(entries));
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
