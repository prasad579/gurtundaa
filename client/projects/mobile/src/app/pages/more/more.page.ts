import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, ProviderCustomersApi } from '@gurtundaa/shared';
import { AlertController, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, linkOutline, logOutOutline, peopleOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-more',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel],
  templateUrl: './more.page.html',
})
export class MorePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly providerCustomers = inject(ProviderCustomersApi);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);

  protected get email(): string | undefined {
    return this.auth.user()?.email;
  }

  constructor() {
    addIcons({ homeOutline, logOutOutline, peopleOutline, linkOutline });
  }

  protected async linkToProvider(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Link to a Provider',
      message: 'Enter the code your milkman or dhobi gave you.',
      inputs: [{ name: 'code', type: 'text', placeholder: 'GRV-XXXX' }],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        { text: 'link', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const code = (data?.values?.code as string)?.trim();
    if (role !== 'confirm' || !code) return;

    try {
      const result = await firstValueFrom(this.providerCustomers.claim({ linkCode: code }));
      const toast = await this.toasts.create({ message: `linked to ${result.name} ✅`, duration: 2200, position: 'bottom' });
      await toast.present();
    } catch (e) {
      const toast = await this.toasts.create({
        message: (e as { error?: { title?: string } })?.error?.title ?? "couldn't link that code",
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    }
  }

  protected async openProfile(): Promise<void> {
    await this.router.navigateByUrl('/profile');
  }

  protected async openContacts(): Promise<void> {
    await this.router.navigateByUrl('/contacts');
  }

  protected async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } catch {
      // Local session is cleared synchronously inside logout() before the network call,
      // so even if the server-side revoke fails there's nothing left to stay signed into.
    }
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
