import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { ClaimProviderCustomerRequest, ProviderManualCustomer, SaveProviderManualCustomerRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ProviderCustomersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/provider-customers`;

  list(): Observable<ProviderManualCustomer[]> {
    return this.http.get<ProviderManualCustomer[]>(this.url);
  }

  create(request: SaveProviderManualCustomerRequest): Observable<ProviderManualCustomer> {
    return this.http.post<ProviderManualCustomer>(this.url, request);
  }

  update(id: string, request: SaveProviderManualCustomerRequest): Observable<ProviderManualCustomer> {
    return this.http.put<ProviderManualCustomer>(`${this.url}/${id}`, request);
  }

  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  generateLinkCode(id: string): Observable<ProviderManualCustomer> {
    return this.http.post<ProviderManualCustomer>(`${this.url}/${id}/link-code`, {});
  }

  /** Called by a real (Customer) account entering a code a provider shared with them. */
  claim(request: ClaimProviderCustomerRequest): Observable<ProviderManualCustomer> {
    return this.http.post<ProviderManualCustomer>(`${this.url}/claim`, request);
  }
}
