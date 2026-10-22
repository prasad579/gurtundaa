import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { ProviderPaymentSettings, SaveProviderPaymentSettingsRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ProviderPaymentSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/provider/payment-settings`;

  get(): Observable<ProviderPaymentSettings> {
    return this.http.get<ProviderPaymentSettings>(this.url);
  }

  save(request: SaveProviderPaymentSettingsRequest): Observable<ProviderPaymentSettings> {
    return this.http.put<ProviderPaymentSettings>(this.url, request);
  }
}
