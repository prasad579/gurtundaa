import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import {
  MilkActivityItem,
  MilkExtraRequestItem,
  MilkMonth,
  MilkPause,
  MilkQuantityChange,
  MilkSubscription,
  MilkToday,
  SaveMilkExtraRequestRequest,
  SaveMilkPauseRequest,
  SaveMilkQuantityChangeRequest,
  SaveMilkSubscriptionRequest,
  SetMilkDeliveryOverrideRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class MilkApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/milk`;

  /** `null` means the household hasn't set up a milk subscription yet. */
  getSubscription(): Observable<MilkSubscription | null> {
    return this.http
      .get<MilkSubscription>(`${this.url}/subscription`, { observe: 'response' })
      .pipe(map((response) => (response.status === 204 ? null : response.body)));
  }

  saveSubscription(request: SaveMilkSubscriptionRequest): Observable<MilkSubscription> {
    return this.http.put<MilkSubscription>(`${this.url}/subscription`, request);
  }

  getMonth(year: number, month: number): Observable<MilkMonth> {
    return this.http.get<MilkMonth>(`${this.url}/deliveries`, {
      params: new HttpParams().set('year', year).set('month', month),
    });
  }

  getToday(): Observable<MilkToday> {
    return this.http.get<MilkToday>(`${this.url}/deliveries/today`);
  }

  setDeliveryOverride(date: string, request: SetMilkDeliveryOverrideRequest): Observable<MilkToday> {
    return this.http.patch<MilkToday>(`${this.url}/deliveries/${date}`, request);
  }

  listPauses(upcomingOnly = false): Observable<MilkPause[]> {
    return this.http.get<MilkPause[]>(`${this.url}/pauses`, {
      params: new HttpParams().set('upcoming', upcomingOnly),
    });
  }

  createPause(request: SaveMilkPauseRequest): Observable<MilkPause> {
    return this.http.post<MilkPause>(`${this.url}/pauses`, request);
  }

  updatePause(id: string, request: SaveMilkPauseRequest): Observable<MilkPause> {
    return this.http.put<MilkPause>(`${this.url}/pauses/${id}`, request);
  }

  deletePause(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/pauses/${id}`);
  }

  listExtraRequests(upcomingOnly = false): Observable<MilkExtraRequestItem[]> {
    return this.http.get<MilkExtraRequestItem[]>(`${this.url}/extra-requests`, {
      params: new HttpParams().set('upcoming', upcomingOnly),
    });
  }

  createExtraRequest(request: SaveMilkExtraRequestRequest): Observable<MilkExtraRequestItem> {
    return this.http.post<MilkExtraRequestItem>(`${this.url}/extra-requests`, request);
  }

  deleteExtraRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/extra-requests/${id}`);
  }

  getActivity(take = 10): Observable<MilkActivityItem[]> {
    return this.http.get<MilkActivityItem[]>(`${this.url}/activity`, {
      params: new HttpParams().set('take', take),
    });
  }

  listQuantityChanges(upcomingOnly = false): Observable<MilkQuantityChange[]> {
    return this.http.get<MilkQuantityChange[]>(`${this.url}/quantity-changes`, {
      params: new HttpParams().set('upcoming', upcomingOnly),
    });
  }

  createQuantityChange(request: SaveMilkQuantityChangeRequest): Observable<MilkQuantityChange> {
    return this.http.post<MilkQuantityChange>(`${this.url}/quantity-changes`, request);
  }

  updateQuantityChange(id: string, request: SaveMilkQuantityChangeRequest): Observable<MilkQuantityChange> {
    return this.http.put<MilkQuantityChange>(`${this.url}/quantity-changes/${id}`, request);
  }

  deleteQuantityChange(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/quantity-changes/${id}`);
  }
}
