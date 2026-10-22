import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import {
  AddManualMilkExtraRequest,
  AddManualMilkReturnRequest,
  ManualMilkDayCustomer,
  ManualMilkDaySummary,
  ManualMilkEntry,
  MilkMonth,
  SaveManualMilkEntryRequest,
  SetManualMilkPaidRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class ManualMilkApi {
  private readonly http = inject(HttpClient);
  private readonly url = inject(GURTUNDAA_API_URL);

  private entriesUrl(providerCustomerId: string): string {
    return `${this.url}/provider-customers/${providerCustomerId}/milk-entries`;
  }

  list(providerCustomerId: string, take = 30): Observable<ManualMilkEntry[]> {
    return this.http.get<ManualMilkEntry[]>(this.entriesUrl(providerCustomerId), { params: new HttpParams().set('take', take) });
  }

  upsert(providerCustomerId: string, request: SaveManualMilkEntryRequest): Observable<ManualMilkEntry> {
    return this.http.put<ManualMilkEntry>(this.entriesUrl(providerCustomerId), request);
  }

  addExtra(providerCustomerId: string, request: AddManualMilkExtraRequest): Observable<ManualMilkEntry> {
    return this.http.post<ManualMilkEntry>(`${this.entriesUrl(providerCustomerId)}/extra`, request);
  }

  addReturn(providerCustomerId: string, request: AddManualMilkReturnRequest): Observable<ManualMilkEntry> {
    return this.http.post<ManualMilkEntry>(`${this.entriesUrl(providerCustomerId)}/return`, request);
  }

  setPaid(providerCustomerId: string, entryId: string, request: SetManualMilkPaidRequest): Observable<ManualMilkEntry> {
    return this.http.patch<ManualMilkEntry>(`${this.entriesUrl(providerCustomerId)}/${entryId}/paid`, request);
  }

  delete(providerCustomerId: string, entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.entriesUrl(providerCustomerId)}/${entryId}`);
  }

  getMonth(providerCustomerId: string, year: number, month: number): Observable<MilkMonth> {
    return this.http.get<MilkMonth>(`${this.entriesUrl(providerCustomerId)}/month`, {
      params: new HttpParams().set('year', year).set('month', month),
    });
  }

  /** Per-day totals across every manual milk customer, for the dashboard-wide calendar. */
  getProviderMonthSummary(year: number, month: number): Observable<ManualMilkDaySummary[]> {
    return this.http.get<ManualMilkDaySummary[]>(`${this.url}/provider-customers/milk-summary/month`, {
      params: new HttpParams().set('year', year).set('month', month),
    });
  }

  /** Per-customer breakdown for one day. */
  getDayDetail(date: string): Observable<ManualMilkDayCustomer[]> {
    return this.http.get<ManualMilkDayCustomer[]>(`${this.url}/provider-customers/milk-summary/day`, {
      params: new HttpParams().set('date', date),
    });
  }
}
