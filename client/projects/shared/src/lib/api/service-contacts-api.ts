import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { SaveServiceContactRequest, ServiceContact, ServiceContactCategory } from './models';

@Injectable({ providedIn: 'root' })
export class ServiceContactsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/service-contacts`;

  list(category: ServiceContactCategory): Observable<ServiceContact[]> {
    return this.http.get<ServiceContact[]>(this.url, { params: new HttpParams().set('category', category) });
  }

  create(request: SaveServiceContactRequest): Observable<ServiceContact> {
    return this.http.post<ServiceContact>(this.url, request);
  }

  update(id: string, request: SaveServiceContactRequest): Observable<ServiceContact> {
    return this.http.put<ServiceContact>(`${this.url}/${id}`, request);
  }

  setDefault(id: string): Observable<ServiceContact> {
    return this.http.patch<ServiceContact>(`${this.url}/${id}/default`, null);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
