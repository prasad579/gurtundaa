import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { PriceListEntry, SavePriceListRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ShopPriceListApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/shop/price-list`;

  get(): Observable<PriceListEntry[]> {
    return this.http.get<PriceListEntry[]>(this.url);
  }

  save(request: SavePriceListRequest): Observable<PriceListEntry[]> {
    return this.http.put<PriceListEntry[]>(this.url, request);
  }
}
