import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { LaundryBatch, LaundryBatchStatus, MarkPickedUpRequest, SaveLaundryBatchRequest, SetLaundryPaidRequest } from './models';

@Injectable({ providedIn: 'root' })
export class LaundryApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/laundry/batches`;

  list(filter: LaundryBatchStatus | 'All' = 'All'): Observable<LaundryBatch[]> {
    return this.http.get<LaundryBatch[]>(this.url, { params: new HttpParams().set('filter', filter) });
  }

  create(request: SaveLaundryBatchRequest): Observable<LaundryBatch> {
    return this.http.post<LaundryBatch>(this.url, request);
  }

  update(id: string, request: SaveLaundryBatchRequest): Observable<LaundryBatch> {
    return this.http.put<LaundryBatch>(`${this.url}/${id}`, request);
  }

  markPickedUp(id: string, request: MarkPickedUpRequest): Observable<LaundryBatch> {
    return this.http.patch<LaundryBatch>(`${this.url}/${id}/pickup`, request);
  }

  setPaid(id: string, request: SetLaundryPaidRequest): Observable<LaundryBatch> {
    return this.http.patch<LaundryBatch>(`${this.url}/${id}/paid`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
