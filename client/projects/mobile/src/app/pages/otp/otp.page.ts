import { Component, ElementRef, OnDestroy, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, BRAND } from '@gurtundaa/shared';
import { IonButton, IonContent, IonText } from '@ionic/angular';

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-otp',
  imports: [ReactiveFormsModule, IonContent, IonButton, IonText],
  templateUrl: './otp.page.html',
  styleUrl: './otp.page.scss',
})
export class OtpPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private cooldownHandle?: ReturnType<typeof setInterval>;

  @ViewChildren('digitInput') private digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly brand = BRAND;
  protected readonly phone = signal(this.route.snapshot.queryParamMap.get('phone') ?? '');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resendCooldown = signal(RESEND_COOLDOWN_SECONDS);
  protected readonly digitIndices = [0, 1, 2, 3, 4, 5];
  protected readonly boxes = signal<string[]>(['', '', '', '', '', '']);

  protected readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.startCooldown();
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownHandle);
  }

  protected digitValue(index: number): string {
    return this.boxes()[index];
  }

  protected onDigitInput(index: number, rawValue: string): void {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    const next = [...this.boxes()];
    next[index] = digit;
    this.boxes.set(next);
    this.form.controls.code.setValue(next.join(''));
    this.error.set(null);

    if (digit && index < 5) {
      this.digitInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  protected onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.boxes()[index] && index > 0) {
      this.digitInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  protected onDigitPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!pasted?.length) return;

    event.preventDefault();
    const next = ['', '', '', '', '', ''];
    pasted.forEach((d, i) => (next[i] = d));
    this.boxes.set(next);
    this.form.controls.code.setValue(next.join(''));
    this.digitInputs.get(Math.min(pasted.length, 6) - 1)?.nativeElement.focus();
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
