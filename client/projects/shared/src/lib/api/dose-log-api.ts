import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { DoseEntry, DoseSlot, SetDoseStatusRequest } from './models';

@Injectable({ providedIn: 'root' })
export class DoseLogApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/health/doses`;

  getToday(): Observable<DoseEntry[]> {
    return this.http.get<DoseEntry[]>(`${this.url}/today`);
  }

  setStatus(medicineId: string, date: string, slot: DoseSlot, request: SetDoseStatusRequest): Observable<DoseEntry> {
    return this.http.patch<DoseEntry>(`${this.url}/${medicineId}/${date}/${slot}`, request);
  }
}
