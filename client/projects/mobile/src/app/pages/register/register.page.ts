import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, BRAND } from '@gurtundaa/shared';
import { IonButton, IonCheckbox, IonContent, IonInput, IonItem, IonList, IonText } from '@ionic/angular';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonList, IonItem, IonInput, IonButton, IonCheckbox, IonText],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly brand = BRAND;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly agreed = signal(false);

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
      this.error.set('fill in all the fields above');
      return;
    }
    if (password.length < 8) {
      this.error.set('password needs 8+ characters');
      return;
    }
    if (password !== confirmPassword) {
      this.error.set("passwords don't match");
      return;
    }
    if (!this.agreed()) {
      this.error.set('agree to the terms to continue');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.register({
        displayName: displayName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      await this.router.navigateByUrl('/onboarding', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
