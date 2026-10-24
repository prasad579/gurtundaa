import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, BRAND } from '@gurtundaa/shared';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonText } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;

type IdentifierKind = 'email' | 'phone' | 'unknown';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonList, IonItem, IonInput, IonButton, IonText, TranslatePipe],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly brand = BRAND;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    identifier: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  private readonly identifier = signal('');

  protected readonly identifierKind = computed<IdentifierKind>(() => {
    const value = this.identifier().trim();
    if (!value) return 'unknown';
    if (EMAIL_PATTERN.test(value)) return 'email';
    if (PHONE_PATTERN.test(value)) return 'phone';
    return 'unknown';
  });

  protected onIdentifierInput(value: string | null | undefined): void {
    this.identifier.set(value ?? '');
  }

  protected async submit(): Promise<void> {
    const identifier = this.identifier().trim();
    const kind = this.identifierKind();
    const password = this.form.controls.password.value;

    if (kind === 'unknown') {
      this.error.set(this.translate.instant('login.errorInvalidIdentifier'));
      return;
    }
    if (kind === 'email' && password.length < 8) {
      this.error.set(this.translate.instant('login.errorShortPassword'));
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      if (kind === 'phone') {
        await this.auth.requestPhoneOtp(identifier);
        await this.router.navigate(['/otp'], { queryParams: { phone: identifier } });
      } else {
        await this.auth.login({ email: identifier, password });
        await this.router.navigateByUrl('/', { replaceUrl: true });
      }
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
