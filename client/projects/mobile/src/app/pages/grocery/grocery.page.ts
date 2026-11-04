import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DayOfWeekName, GroceryApi, GroceryItem } from '@gurtundaa/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, trash } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-grocery',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonFooter,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonCheckbox,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSkeletonText,
    TranslatePipe,
  ],
  templateUrl: './grocery.page.html',
  styleUrl: './grocery.page.scss',
})
export class GroceryPage implements ViewWillEnter {
  private readonly grocery = inject(GroceryApi);

  protected readonly loading = signal(true);
  protected readonly items = signal<GroceryItem[]>([]);
  protected readonly newItemName = signal('');

  protected readonly pending = computed(() => this.items().filter((i) => !i.isChecked));
  protected readonly checked = computed(() => this.items().filter((i) => i.isChecked));

  constructor() {
    addIcons({ addOutline, trash });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected weekdayLabel(day: DayOfWeekName): string {
    return `every ${day}`;
  }

  protected async addItem(): Promise<void> {
    const name = this.newItemName().trim();
    if (!name) return;

    this.newItemName.set('');
    await firstValueFrom(this.grocery.create({ name }));
    await this.load();
  }

  protected async toggle(item: GroceryItem): Promise<void> {
    await firstValueFrom(this.grocery.setChecked(item.id, !item.isChecked));
    await this.load();
  }

  protected async remove(item: GroceryItem, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    await firstValueFrom(this.grocery.delete(item.id));
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await firstValueFrom(this.grocery.list()));
    } finally {
      this.loading.set(false);
    }
  }
}
