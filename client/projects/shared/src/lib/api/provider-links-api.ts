import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { ClaimProviderInviteRequest, CreateProviderInviteRequest, ProviderLink } from './models';

@Injectable({ providedIn: 'root' })
export class ProviderLinksApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/provider-links`;

  /** `null` means this contact has never been invited as a provider. */
  getForContact(serviceContactId: string): Observable<ProviderLink | null> {
    return this.http
      .get<ProviderLink>(`${this.url}/by-contact/${serviceContactId}`, { observe: 'response' })
      .pipe(map((response) => (response.status === 204 ? null : response.body)));
  }

  createInvite(request: CreateProviderInviteRequest): Observable<ProviderLink> {
    return this.http.post<ProviderLink>(this.url, request);
  }

  revoke(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  claim(request: ClaimProviderInviteRequest): Observable<ProviderLink> {
    return this.http.post<ProviderLink>(`${this.url}/claim`, request);
  }
}
