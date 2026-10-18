import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@gurtundaa/shared';
import { IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, logOutOutline, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-more',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel],
  templateUrl: './more.page.html',
})
export class MorePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected get email(): string | undefined {
    return this.auth.user()?.email;
  }

  constructor() {
    addIcons({ homeOutline, logOutOutline, peopleOutline });
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
