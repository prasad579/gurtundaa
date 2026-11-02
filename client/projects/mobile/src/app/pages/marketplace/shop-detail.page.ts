import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DayOfWeekName, GURTUNDAA_API_URL, MarketplaceApi, ShopDetail } from '@gurtundaa/shared';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonSkeletonText, IonTitle, IonToolbar, ViewWillEnter } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

const DAY_LABELS: Record<DayOfWeekName, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

@Component({
  selector: 'app-shop-detail',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonSkeletonText],
  templateUrl: './shop-detail.page.html',
  styleUrl: './shop-detail.page.scss',
})
export class ShopDetailPage implements ViewWillEnter {
  private readonly marketplace = inject(MarketplaceApi);
  private readonly apiOrigin = inject(GURTUNDAA_API_URL).replace(/\/api\/?$/, '');
  private readonly shopUserId = inject(ActivatedRoute).snapshot.paramMap.get('shopUserId')!;

  protected readonly loading = signal(true);
  protected readonly shop = signal<ShopDetail | null>(null);

  protected readonly fullImageUrl = computed(() => {
    const url = this.shop()?.imageUrl;
    return url ? `${this.apiOrigin}${url}` : null;
  });

  protected readonly fullOwnerPhotoUrl = computed(() => {
    const url = this.shop()?.ownerPhotoUrl;
    return url ? `${this.apiOrigin}${url}` : null;
  });

  ionViewWillEnter(): void {
    void this.load();
  }

  protected dayLabel(day: DayOfWeekName): string {
    return DAY_LABELS[day];
  }

  protected hoursLabel(shop: ShopDetail): string {
    if (!shop.opensAt || !shop.closesAt) return 'Hours not set';
    const opens = this.timeLabel(shop.opensAt);
    const closes = this.timeLabel(shop.closesAt);
    return shop.openDays.length === 0 ? `Open every day, ${opens} – ${closes}` : `${opens} – ${closes}`;
  }

  private timeLabel(time: string): string {
    const [hourStr, minuteStr] = time.split(':');
    const hour = Number(hourStr);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minuteStr} ${period}`;
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.shop.set(await firstValueFrom(this.marketplace.getShop(this.shopUserId)));
    } finally {
      this.loading.set(false);
    }
  }
}
