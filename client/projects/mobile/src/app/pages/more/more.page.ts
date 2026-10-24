import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, ProviderCustomersApi } from '@gurtundaa/shared';
import {
  AlertController,
  ActionSheetController,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, languageOutline, linkOutline, logOutOutline, peopleOutline } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { LanguagePreferenceStore } from '../../services/language-preference-store';

@Component({
  selector: 'app-more',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, TranslatePipe],
  templateUrl: './more.page.html',
})
export class MorePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly providerCustomers = inject(ProviderCustomersApi);
  private readonly alerts = inject(AlertController);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly toasts = inject(ToastController);
  private readonly translate = inject(TranslateService);
  private readonly languageStore = inject(LanguagePreferenceStore);

  protected get email(): string | undefined {
    return this.auth.user()?.email;
  }

  constructor() {
    addIcons({ homeOutline, logOutOutline, peopleOutline, linkOutline, languageOutline });
  }

  protected async linkToProvider(): Promise<void> {
    const alert = await this.alerts.create({
      header: this.translate.instant('more.linkProvider.title'),
      message: this.translate.instant('more.linkProvider.message'),
      inputs: [{ name: 'code', type: 'text', placeholder: this.translate.instant('more.linkProvider.placeholder') }],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('common.link'), role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onWillDismiss();
    const code = (data?.values?.code as string)?.trim();
    if (role !== 'confirm' || !code) return;

    try {
      const result = await firstValueFrom(this.providerCustomers.claim({ linkCode: code }));
      const toast = await this.toasts.create({
        message: this.translate.instant('more.linkProvider.success', { name: result.name }),
        duration: 2200,
        position: 'bottom',
      });
      await toast.present();
    } catch (e) {
      const toast = await this.toasts.create({
        message: (e as { error?: { title?: string } })?.error?.title ?? this.translate.instant('more.linkProvider.error'),
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    }
  }

  protected async openLanguagePicker(): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: this.translate.instant('more.language.title'),
      buttons: [
        { text: this.translate.instant('more.language.english'), handler: () => void this.setLanguage('en') },
        { text: this.translate.instant('more.language.telugu'), handler: () => void this.setLanguage('te') },
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async setLanguage(lang: string): Promise<void> {
    await firstValueFrom(this.translate.use(lang));
    await this.languageStore.save(lang);
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
