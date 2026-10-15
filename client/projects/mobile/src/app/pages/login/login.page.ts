import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, BRAND } from '@gurtundaa/shared';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonText,
} from '@ionic/angular';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IonContent, IonList, IonItem, IonInput, IonButton, IonSegment, IonSegmentButton, IonLabel, IonText],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly brand = BRAND;
  protected readonly mode = signal<Mode>('login');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  protected setMode(value: unknown): void {
    this.mode.set(value === 'register' ? 'register' : 'login');
    this.error.set(null);
  }

  protected async submit(): Promise<void> {
    const isRegister = this.mode() === 'register';
    const { displayName, email, password } = this.form.getRawValue();

    if (this.form.invalid || (isRegister && !displayName.trim())) {
      this.form.markAllAsTouched();
      this.error.set(isRegister && !displayName.trim() ? 'what should we call you? 👀' : 'check your email + password (8+ chars)');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      if (isRegister) {
        await this.auth.register({ displayName, email, password });
      } else {
        await this.auth.login({ email, password });
      }
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
