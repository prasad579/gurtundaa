import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { Bill, SaveBillRequest, SetBillPaidRequest } from './models';

@Injectable({ providedIn: 'root' })
export class BillsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/bills`;

  list(): Observable<Bill[]> {
    return this.http.get<Bill[]>(this.url);
  }

  create(request: SaveBillRequest): Observable<Bill> {
    return this.http.post<Bill>(this.url, request);
  }

  update(id: string, request: SaveBillRequest): Observable<Bill> {
    return this.http.put<Bill>(`${this.url}/${id}`, request);
  }

  setPaid(id: string, request: SetBillPaidRequest): Observable<Bill> {
    return this.http.patch<Bill>(`${this.url}/${id}/paid`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
