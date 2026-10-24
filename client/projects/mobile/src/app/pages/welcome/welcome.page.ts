import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BRAND } from '@gurtundaa/shared';
import { IonButton, IonContent } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-welcome',
  imports: [IonContent, IonButton, TranslatePipe],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss',
})
export class WelcomePage {
  private readonly router = inject(Router);

  protected readonly brand = BRAND;

  protected getStarted(): void {
    void this.router.navigateByUrl('/register');
  }

  protected later(): void {
    void this.router.navigateByUrl('/login');
  }
}
