import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import {
  MilkExtraRequestItem,
  MilkMonth,
  MilkToday,
  PendingMilkPayment,
  ProviderLaundryCustomerDetail,
  ProviderLaundryDashboard,
  ProviderMilkCustomerDetail,
  ProviderMilkDashboard,
  SaveMilkExtraRequestRequest,
  SetMilkDeliveryOverrideRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class ProviderDashboardApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/provider`;

  getLaundryDashboard(): Observable<ProviderLaundryDashboard> {
    return this.http.get<ProviderLaundryDashboard>(`${this.url}/laundry/dashboard`);
  }

  getLaundryCustomer(householdUserId: string): Observable<ProviderLaundryCustomerDetail> {
    return this.http.get<ProviderLaundryCustomerDetail>(`${this.url}/laundry/customers/${householdUserId}`);
  }

  getMilkDashboard(): Observable<ProviderMilkDashboard> {
    return this.http.get<ProviderMilkDashboard>(`${this.url}/milk/dashboard`);
  }

  getMilkCustomer(householdUserId: string): Observable<ProviderMilkCustomerDetail> {
    return this.http.get<ProviderMilkCustomerDetail>(`${this.url}/milk/customers/${householdUserId}`);
  }

  getMilkCustomerMonth(householdUserId: string, year: number, month: number): Observable<MilkMonth> {
    return this.http.get<MilkMonth>(`${this.url}/milk/customers/${householdUserId}/month`, {
      params: new HttpParams().set('year', year).set('month', month),
    });
  }

  /** Marks a household's slot delivered/missed on their behalf — tagged and surfaced to them as "added by your milkman". */
  setMilkDeliveryOverride(householdUserId: string, date: string, request: SetMilkDeliveryOverrideRequest): Observable<MilkToday> {
    return this.http.patch<MilkToday>(`${this.url}/milk/customers/${householdUserId}/deliveries/${date}`, request);
  }

  /** Logs extra milk on a household's behalf — tagged and surfaced to them as "added by your milkman". */
  addMilkExtra(householdUserId: string, request: SaveMilkExtraRequestRequest): Observable<MilkExtraRequestItem> {
    return this.http.post<MilkExtraRequestItem>(`${this.url}/milk/customers/${householdUserId}/extra-requests`, request);
  }

  /** UPI payments from any linked household awaiting this provider's confirmation they actually received the money. */
  listPendingMilkPayments(): Observable<PendingMilkPayment[]> {
    return this.http.get<PendingMilkPayment[]>(`${this.url}/milk/payments/pending`);
  }

  confirmMilkPayment(paymentId: string): Observable<void> {
    return this.http.post<void>(`${this.url}/milk/payments/${paymentId}/confirm`, {});
  }

  rejectMilkPayment(paymentId: string): Observable<void> {
    return this.http.post<void>(`${this.url}/milk/payments/${paymentId}/reject`, {});
  }
}
