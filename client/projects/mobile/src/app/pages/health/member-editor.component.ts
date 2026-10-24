import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HouseholdMember, SaveHouseholdMemberRequest } from '@gurtundaa/shared';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

const AVATAR_OPTIONS = ['🧑', '👨', '👩', '👴', '👵', '👦', '👧', '👶'];
const RELATION_OPTIONS = ['Self', 'Spouse', 'Child', 'Parent', 'Other'];

@Component({
  selector: 'app-member-editor',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button (click)="dismiss()">{{ 'common.cancel' | translate }}</ion-button></ion-buttons>
        <ion-title>{{ (member ? 'memberEditor.editTitle' : 'memberEditor.newTitle') | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button strong="true" [disabled]="form.invalid" (click)="save()">{{ 'common.save' | translate }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h3 class="section-title">{{ 'memberEditor.avatarTitle' | translate }}</h3>
      <div class="avatar-grid">
        @for (a of avatarOptions; track a) {
          <button type="button" class="avatar-chip" [class.sel]="avatar() === a" (click)="avatar.set(a)">{{ a }}</button>
        }
      </div>

      <form [formGroup]="form">
        <ion-list lines="none">
          <ion-item>
            <ion-input
              formControlName="name"
              [label]="'memberEditor.nameLabel' | translate"
              labelPlacement="stacked"
              [placeholder]="'memberEditor.namePlaceholder' | translate"
              [maxlength]="50"
            />
          </ion-item>
        </ion-list>

        <h3 class="section-title">{{ 'memberEditor.relationTitle' | translate }}</h3>
        <div class="chips">
          @for (r of relationOptions; track r) {
            <button type="button" class="chip" [class.sel]="form.controls.relation.value === r" (click)="form.controls.relation.setValue(r)">
              {{ 'memberEditor.relations.' + r | translate }}
            </button>
          }
        </div>
      </form>
    </ion-content>
  `,
  styles: `
    .section-title { margin: 18px 4px 8px; font-size: 13px; font-weight: 800; }
    .avatar-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .avatar-chip {
      font-size: 24px;
      padding: 10px 0;
      border-radius: 12px;
      background: var(--ion-color-step-50, rgb(124 58 237 / 0.06));
      border: 1.5px solid transparent;
      &.sel { border-color: var(--ion-color-primary, #7c3aed); }
    }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      padding: 7px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: var(--ion-color-step-50, rgb(124 58 237 / 0.06));
      color: var(--ion-color-primary, #7c3aed);
      border: 1.5px solid transparent;
      &.sel { background: var(--ion-color-primary, #7c3aed); color: #fff; }
    }
  `,
})
export class MemberEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() member?: HouseholdMember;

  protected readonly avatarOptions = AVATAR_OPTIONS;
  protected readonly relationOptions = RELATION_OPTIONS;
  protected readonly avatar = signal(AVATAR_OPTIONS[0]);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    relation: new FormControl('Self', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.member) {
      this.avatar.set(this.member.avatarEmoji);
      this.form.setValue({ name: this.member.name, relation: this.member.relation });
    }
  }

  protected dismiss(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected save(): Promise<boolean> {
    const v = this.form.getRawValue();
    const request: SaveHouseholdMemberRequest = {
      name: v.name.trim(),
      relation: v.relation,
      avatarEmoji: this.avatar(),
    };
    return this.modalCtrl.dismiss(request, 'save');
  }
}
