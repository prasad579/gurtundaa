import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { PrescriptionDto, SavePrescriptionRequest } from './models';

@Injectable({ providedIn: 'root' })
export class PrescriptionsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/health/prescriptions`;

  list(): Observable<PrescriptionDto[]> {
    return this.http.get<PrescriptionDto[]>(this.url);
  }

  create(request: SavePrescriptionRequest): Observable<PrescriptionDto> {
    return this.http.post<PrescriptionDto>(this.url, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
