import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DayOfWeekName, GURTUNDAA_API_URL, MARKETPLACE_CATALOG, ShopProfileApi } from '@gurtundaa/shared';
import { AppGeolocation } from '../../../services/geolocation';
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, checkmark, closeCircle, locationOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

const DAY_OPTIONS: { value: DayOfWeekName; label: string }[] = [
  { value: 'Monday', label: 'Mon' },
  { value: 'Tuesday', label: 'Tue' },
  { value: 'Wednesday', label: 'Wed' },
  { value: 'Thursday', label: 'Thu' },
  { value: 'Friday', label: 'Fri' },
  { value: 'Saturday', label: 'Sat' },
  { value: 'Sunday', label: 'Sun' },
];

@Component({
  selector: 'app-shop-profile',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
  ],
  templateUrl: './shop-profile.page.html',
  styleUrl: './shop-profile.page.scss',
})
export class ShopProfilePage implements ViewWillEnter {
  private readonly shopProfile = inject(ShopProfileApi);
  private readonly geo = inject(AppGeolocation);
  private readonly toasts = inject(ToastController);
  private readonly apiOrigin = inject(GURTUNDAA_API_URL).replace(/\/api\/?$/, '');

  protected readonly categories = MARKETPLACE_CATALOG;
  protected readonly dayOptions = DAY_OPTIONS;
  protected readonly busy = signal(false);
  protected readonly uploadingImage = signal(false);
  protected readonly selectedCategoryKeys = signal<ReadonlySet<string>>(new Set());

  protected readonly imageUrl = signal<string | null>(null);
  protected readonly contactPhones = signal<string[]>([]);
  protected readonly newPhone = new FormControl('', { nonNullable: true });
  protected readonly opensAt = signal<string | null>(null);
  protected readonly closesAt = signal<string | null>(null);
  protected readonly openDays = signal<ReadonlySet<DayOfWeekName>>(new Set());
  protected readonly latitude = signal<number | null>(null);
  protected readonly longitude = signal<number | null>(null);
  protected readonly locatingMe = signal(false);

  constructor() {
    addIcons({ checkmark, camera, closeCircle, locationOutline });
  }

  protected readonly form = new FormGroup({
    shopName: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });

  protected readonly categoryCountLabel = computed(() => `${this.selectedCategoryKeys().size} of ${this.categories.length} categories selected`);

  protected readonly fullImageUrl = computed(() => {
    const url = this.imageUrl();
    return url ? `${this.apiOrigin}${url}` : null;
  });

  protected readonly locationLabel = computed(() => {
    const lat = this.latitude();
    const lng = this.longitude();
    return lat !== null && lng !== null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Not set';
  });

  ionViewWillEnter(): void {
    void this.load();
  }

  protected toggleCategory(key: string): void {
    this.selectedCategoryKeys.update((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  protected toggleDay(day: DayOfWeekName): void {
    this.openDays.update((current) => {
      const next = new Set(current);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  protected onOpensAtChange(value: string): void {
    this.opensAt.set(this.toTimeOnly(value));
  }

  protected onClosesAtChange(value: string): void {
    this.closesAt.set(this.toTimeOnly(value));
  }

  protected addPhone(): void {
    const value = this.newPhone.value.trim();
    if (!value) return;
    this.contactPhones.update((list) => (list.includes(value) ? list : [...list, value]));
    this.newPhone.setValue('');
  }

  protected removePhone(phone: string): void {
    this.contactPhones.update((list) => list.filter((p) => p !== phone));
  }

  protected async onImageSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    try {
      const result = await firstValueFrom(this.shopProfile.uploadImage(file));
      this.imageUrl.set(result.imageUrl);
      await this.toast('photo updated ✅');
    } catch {
      await this.toast("couldn't upload photo, try again", 'danger');
    } finally {
      this.uploadingImage.set(false);
      (event.target as HTMLInputElement).value = '';
    }
  }

  protected async useMyLocation(): Promise<void> {
    this.locatingMe.set(true);
    const position = await this.geo.getCurrentPosition();
    this.locatingMe.set(false);

    if (!position) {
      await this.toast("couldn't get your location — check location permission", 'danger');
      return;
    }
    this.latitude.set(position.latitude);
    this.longitude.set(position.longitude);
  }

  protected async save(): Promise<void> {
    const { shopName, city, address } = this.form.getRawValue();
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.shopProfile.save({
          shopName: shopName.trim(),
          city: city.trim() || null,
          address: address.trim() || null,
          servedCategoryKeys: [...this.selectedCategoryKeys()],
          imageUrl: this.imageUrl(),
          contactPhones: this.contactPhones(),
          opensAt: this.opensAt(),
          closesAt: this.closesAt(),
          openDays: [...this.openDays()],
          latitude: this.latitude(),
          longitude: this.longitude(),
        }),
      );
      await this.toast('profile saved ✅');
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    const profile = await firstValueFrom(this.shopProfile.get());
    if (profile) {
      this.form.setValue({ shopName: profile.shopName, city: profile.city ?? '', address: profile.address ?? '' });
      // Drop category keys that no longer exist in the catalog (e.g. left over from an older catalog
      // version) — they can never be unchecked in the UI since it only renders current categories, so
      // without this they'd round-trip on every save and silently keep blocking real categories from matching.
      const validKeys = new Set(this.categories.map((c) => c.key));
      this.selectedCategoryKeys.set(new Set(profile.servedCategoryKeys.filter((key) => validKeys.has(key))));
      this.imageUrl.set(profile.imageUrl);
      this.contactPhones.set(profile.contactPhones);
      this.opensAt.set(profile.opensAt);
      this.closesAt.set(profile.closesAt);
      this.openDays.set(new Set(profile.openDays));
      this.latitude.set(profile.latitude);
      this.longitude.set(profile.longitude);
    }
  }

  // ion-datetime (presentation="time") emits a full ISO datetime string — keep just the HH:mm:ss
  // time portion since that's all the server's TimeOnly field needs.
  private toTimeOnly(isoValue: string): string {
    const match = isoValue.match(/T(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : isoValue;
  }

  private async toast(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 1800, position: 'bottom', color });
    await toast.present();
  }
}
