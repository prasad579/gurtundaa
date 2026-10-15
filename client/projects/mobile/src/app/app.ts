import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  // Auth screens swap back and forth rather than drilling down, so the native
  // stack-push transition just doubles up their gradient backgrounds mid-animation.
  template: '<ion-app><ion-router-outlet [animated]="false" /></ion-app>',
})
export class App {}
