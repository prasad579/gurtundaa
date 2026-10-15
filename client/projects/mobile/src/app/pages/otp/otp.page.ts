import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, BRAND } from '@gurtundaa/shared';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonText } from '@ionic/angular';

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-otp',
  imports: [ReactiveFormsModule, IonContent, IonList, IonItem, IonInput, IonButton, IonText],
  templateUrl: './otp.page.html',
  styleUrl: './otp.page.scss',
})
export class OtpPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private cooldownHandle?: ReturnType<typeof setInterval>;

  protected readonly brand = BRAND;
  protected readonly phone = signal(this.route.snapshot.queryParamMap.get('phone') ?? '');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resendCooldown = signal(RESEND_COOLDOWN_SECONDS);

  protected readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.startCooldown();
    this.form.controls.code.valueChanges.subscribe((value) => {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      if (digitsOnly !== value) {
        this.form.controls.code.setValue(digitsOnly, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownHandle);
  }

  protected async verify(): Promise<void> {
    const code = this.form.controls.code.value;
    if (code.length < 4) {
      this.error.set('enter the code we sent you');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.verifyPhoneOtp({ phoneNumber: this.phone(), code });
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  protected async resend(): Promise<void> {
    if (this.resendCooldown() > 0 || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.requestPhoneOtp(this.phone());
      this.startCooldown();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  private startCooldown(): void {
    clearInterval(this.cooldownHandle);
    this.resendCooldown.set(RESEND_COOLDOWN_SECONDS);
    this.cooldownHandle = setInterval(() => {
      this.resendCooldown.update((s) => Math.max(0, s - 1));
      if (this.resendCooldown() === 0) {
        clearInterval(this.cooldownHandle);
      }
    }, 1000);
  }
}
