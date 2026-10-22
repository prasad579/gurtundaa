import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { CreatePickupRequestRequest, LaundryPickupRequest } from './models';

@Injectable({ providedIn: 'root' })
export class LaundryPickupRequestsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/laundry/pickup-requests`;

  /** Household side: ask a linked dhobi to collect laundry on a date. */
  create(request: CreatePickupRequestRequest): Observable<LaundryPickupRequest> {
    return this.http.post<LaundryPickupRequest>(this.url, request);
  }

  /** Provider side: pending requests from linked households. */
  listPending(): Observable<LaundryPickupRequest[]> {
    return this.http.get<LaundryPickupRequest[]>(`${this.url}/pending`);
  }

  markHandled(id: string): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/handled`, {});
  }
}
