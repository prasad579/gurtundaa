import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssistantApi } from '@gurtundaa/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, sendOutline } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  understood?: boolean;
}

const EXAMPLES = [
  'pause milk for 3 days',
  'remind mother to take her medicine after lunch',
  'add vegetables to our grocery list every Sunday',
  "what are today's activities for my father?",
];

@Component({
  selector: 'app-assistant',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonFooter,
    IonInput,
    IonButton,
    IonIcon,
    TranslatePipe,
  ],
  templateUrl: './assistant.page.html',
  styleUrl: './assistant.page.scss',
})
export class AssistantPage {
  private readonly assistant = inject(AssistantApi);
  private readonly translate = inject(TranslateService);

  protected readonly examples = EXAMPLES;
  protected readonly input = signal('');
  protected readonly sending = signal(false);
  protected readonly messages = signal<ChatMessage[]>([
    { role: 'assistant', text: this.translate.instant('assistant.greeting') },
  ]);

  constructor() {
    addIcons({ sendOutline, checkmarkCircle });
  }

  protected useExample(text: string): void {
    this.input.set(text);
  }

  protected async send(): Promise<void> {
    const text = this.input().trim();
    if (!text || this.sending()) return;

    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.input.set('');
    this.sending.set(true);

    try {
      const reply = await firstValueFrom(this.assistant.sendCommand(text));
      this.messages.update((m) => [...m, { role: 'assistant', text: reply.reply, understood: reply.understood }]);
    } catch {
      this.messages.update((m) => [...m, { role: 'assistant', text: this.translate.instant('assistant.error'), understood: false }]);
    } finally {
      this.sending.set(false);
    }
  }
}
