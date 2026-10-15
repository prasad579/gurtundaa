import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { HouseholdProfile, SaveHouseholdProfileRequest } from './models';

@Injectable({ providedIn: 'root' })
export class HouseholdApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/household/profile`;

  /** `null` means the user hasn't saved a household profile yet (skipped onboarding or never finished it). */
  get(): Observable<HouseholdProfile | null> {
    return this.http
      .get<HouseholdProfile>(this.url, { observe: 'response' })
      .pipe(map((response) => (response.status === 204 ? null : response.body)));
  }

  save(request: SaveHouseholdProfileRequest): Observable<HouseholdProfile> {
    return this.http.put<HouseholdProfile>(this.url, request);
  }
}
