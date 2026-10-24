import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, BRAND, UserType } from '@gurtundaa/shared';
import { IonButton, IonCheckbox, IonContent, IonInput, IonItem, IonList, IonText } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface UserTypeOption {
  value: UserType;
  icon: string;
}

// label/hint for each option live in i18n (`register.userTypes.<value>.label/.hint`), keyed
// dynamically off `value` in the template, rather than duplicated here.
const USER_TYPE_OPTIONS: UserTypeOption[] = [
  { value: 'Customer', icon: '🛍️' },
  { value: 'Shop', icon: '🏪' },
  { value: 'MilkProvider', icon: '🥛' },
  { value: 'LaundryProvider', icon: '🧺' },
];

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonList, IonItem, IonInput, IonButton, IonCheckbox, IonText, TranslatePipe],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly brand = BRAND;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly agreed = signal(false);
  protected readonly userType = signal<UserType>('Customer');
  protected readonly userTypeOptions = USER_TYPE_OPTIONS;

  protected setUserType(value: UserType): void {
    this.userType.set(value);
  }

  protected readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    phoneNumber: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    confirmPassword: new FormControl('', { nonNullable: true }),
  });

  protected setAgreed(value: boolean): void {
    this.agreed.set(value);
  }

  protected async submit(): Promise<void> {
    const { displayName, email, phoneNumber, password, confirmPassword } = this.form.getRawValue();

    if (!displayName.trim() || !email.trim() || !phoneNumber.trim()) {
      this.error.set(this.translate.instant('register.errorFillFields'));
      return;
    }
    if (password.length < 8) {
      this.error.set(this.translate.instant('register.errorShortPassword'));
      return;
    }
    if (password !== confirmPassword) {
      this.error.set(this.translate.instant('register.errorPasswordMismatch'));
      return;
    }
    if (!this.agreed()) {
      this.error.set(this.translate.instant('register.errorAgreeTerms'));
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      const user = await this.auth.register({
        displayName: displayName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        userType: this.userType(),
      });
      await this.router.navigateByUrl(this.postRegisterRoute(user.userType), { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  private postRegisterRoute(userType: UserType): string {
    switch (userType) {
      case 'Shop':
        return '/shop-onboarding';
      case 'MilkProvider':
        return '/provider/milk';
      case 'LaundryProvider':
        return '/provider/laundry';
      default:
        return '/onboarding';
    }
  }
}
