import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { HouseholdMember, SaveHouseholdMemberRequest } from './models';

@Injectable({ providedIn: 'root' })
export class HouseholdMembersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/health/members`;

  list(): Observable<HouseholdMember[]> {
    return this.http.get<HouseholdMember[]>(this.url);
  }

  create(request: SaveHouseholdMemberRequest): Observable<HouseholdMember> {
    return this.http.post<HouseholdMember>(this.url, request);
  }

  update(id: string, request: SaveHouseholdMemberRequest): Observable<HouseholdMember> {
    return this.http.put<HouseholdMember>(`${this.url}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
