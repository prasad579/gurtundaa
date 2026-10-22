import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ProviderLink, ProviderLinksApi, ServiceContact, shareOnWhatsApp } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-invite-provider',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>invite as provider</ion-title>
        <ion-buttons slot="end"><ion-button (click)="dismiss()">close</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (loading()) {
        <div class="center"><ion-spinner /></div>
      } @else if (link(); as l) {
        <p class="lead">Share this code with <b>{{ contact.name }}</b> so they can see their orders from you.</p>

        <div class="code-box">
          <div class="code">{{ l.inviteCode }}</div>
          <div class="hint">
            @if (l.isClaimed) {
              ✅ Linked — {{ l.providerDisplayName }} can see your orders
            } @else {
              They enter this once, after signing up as a provider, to link your account.
            }
          </div>
        </div>

        <ion-button expand="block" (click)="share()">💬 Share via WhatsApp</ion-button>
        <ion-button expand="block" fill="outline" (click)="copy()">📋 Copy Code</ion-button>

        @if (!l.isClaimed) {
          <ion-button expand="block" fill="clear" color="danger" (click)="revoke()">Cancel Invite</ion-button>
        } @else {
          <ion-button expand="block" fill="clear" color="danger" (click)="revoke()">Revoke Access</ion-button>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .center { display: flex; justify-content: center; padding: 40px 0; }
      .lead { font-size: 13px; color: var(--ion-color-medium); }
      .code-box {
        text-align: center;
        background: var(--ion-color-step-100, #ede7fd);
        border: 1.5px dashed var(--ion-color-primary, #7c3aed);
        border-radius: 14px;
        padding: 18px;
        margin: 12px 0 20px;
      }
      .code { font-size: 26px; font-weight: 800; letter-spacing: 3px; color: var(--ion-color-primary, #7c3aed); }
      .hint { font-size: 11px; color: var(--ion-color-medium); margin-top: 8px; }
    `,
  ],
})
export class InviteProviderComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly links = inject(ProviderLinksApi);
  private readonly toasts = inject(ToastController);

  @Input({ required: true }) contact!: ServiceContact;

  protected readonly loading = signal(true);
  protected readonly link = signal<ProviderLink | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.link.set(await firstValueFrom(this.links.createInvite({ serviceContactId: this.contact.id })));
    } catch {
      await this.toast("couldn't create an invite right now", 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  protected share(): void {
    const l = this.link();
    if (!l) return;
    shareOnWhatsApp(this.contact.phone, `Hi ${this.contact.name}! Use this code to link your Gurtundaa provider account to me: ${l.inviteCode}`);
  }

  protected async copy(): Promise<void> {
    const l = this.link();
    if (!l) return;
    await navigator.clipboard.writeText(l.inviteCode);
    await this.toast('code copied');
  }

  protected async revoke(): Promise<void> {
    const l = this.link();
    if (!l) return;
    await firstValueFrom(this.links.revoke(l.id));
    await this.toast('invite revoked');
    await this.dismiss();
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss();
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
