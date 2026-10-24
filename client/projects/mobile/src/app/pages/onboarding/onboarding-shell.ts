import { Component, input, output } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-onboarding-shell',
  imports: [IonContent, IonButton, TranslatePipe],
  templateUrl: './onboarding-shell.html',
  styleUrl: './onboarding-shell.scss',
})
export class OnboardingShell {
  readonly step = input.required<number>();
  readonly totalSteps = input(5);
  /** Translation key, not display text — piped through `| translate` in the template. */
  readonly title = input.required<string>();
  /** Translation key, not display text. */
  readonly subtitle = input<string>();
  readonly showBack = input(true);
  /** Translation key, not display text. */
  readonly continueLabel = input('onboarding.continueDefault');
  readonly continueDisabled = input(false);

  readonly back = output<void>();
  readonly continueClick = output<void>();
  readonly skip = output<void>();
}
