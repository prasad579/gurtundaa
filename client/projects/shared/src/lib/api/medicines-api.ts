import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { Medicine, SaveMedicineRequest } from './models';

@Injectable({ providedIn: 'root' })
export class MedicinesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/health/medicines`;

  list(): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(this.url);
  }

  create(request: SaveMedicineRequest): Observable<Medicine> {
    return this.http.post<Medicine>(this.url, request);
  }

  update(id: string, request: SaveMedicineRequest): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.url}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
