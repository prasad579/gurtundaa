import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import {
  ManualLaundryBatch,
  MarkManualPickedUpRequest,
  SaveManualLaundryBatchRequest,
  SetManualLaundryPaidRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class ManualLaundryApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(GURTUNDAA_API_URL);

  private batchesUrl(providerCustomerId: string): string {
    return `${this.base}/provider-customers/${providerCustomerId}/laundry-batches`;
  }

  list(providerCustomerId: string): Observable<ManualLaundryBatch[]> {
    return this.http.get<ManualLaundryBatch[]>(this.batchesUrl(providerCustomerId));
  }

  create(providerCustomerId: string, request: SaveManualLaundryBatchRequest): Observable<ManualLaundryBatch> {
    return this.http.post<ManualLaundryBatch>(this.batchesUrl(providerCustomerId), request);
  }

  markPickedUp(providerCustomerId: string, batchId: string, request: MarkManualPickedUpRequest): Observable<ManualLaundryBatch> {
    return this.http.patch<ManualLaundryBatch>(`${this.batchesUrl(providerCustomerId)}/${batchId}/pickup`, request);
  }

  setPaid(providerCustomerId: string, batchId: string, request: SetManualLaundryPaidRequest): Observable<ManualLaundryBatch> {
    return this.http.patch<ManualLaundryBatch>(`${this.batchesUrl(providerCustomerId)}/${batchId}/paid`, request);
  }

  delete(providerCustomerId: string, batchId: string): Observable<void> {
    return this.http.delete<void>(`${this.batchesUrl(providerCustomerId)}/${batchId}`);
  }
}
