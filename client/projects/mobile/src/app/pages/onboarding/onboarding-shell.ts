import { Component, input, output } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular';

@Component({
  selector: 'app-onboarding-shell',
  imports: [IonContent, IonButton],
  templateUrl: './onboarding-shell.html',
  styleUrl: './onboarding-shell.scss',
})
export class OnboardingShell {
  readonly step = input.required<number>();
  readonly totalSteps = input(5);
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly showBack = input(true);
  readonly continueLabel = input('continue');
  readonly continueDisabled = input(false);

  readonly back = output<void>();
  readonly continueClick = output<void>();
  readonly skip = output<void>();
}
