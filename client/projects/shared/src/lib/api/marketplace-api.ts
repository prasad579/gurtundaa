import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import {
  AcceptQuoteRequest,
  QuotationRequest,
  QuotationRequestDetail,
  ShopSummary,
  SubmitQuotationRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class MarketplaceApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/marketplace`;

  submit(request: SubmitQuotationRequest): Observable<QuotationRequest> {
    return this.http.post<QuotationRequest>(`${this.url}/requests`, request);
  }

  list(): Observable<QuotationRequest[]> {
    return this.http.get<QuotationRequest[]>(`${this.url}/requests`);
  }

  getDetail(id: string): Observable<QuotationRequestDetail> {
    return this.http.get<QuotationRequestDetail>(`${this.url}/requests/${id}`);
  }

  accept(id: string, request: AcceptQuoteRequest): Observable<QuotationRequestDetail> {
    return this.http.post<QuotationRequestDetail>(`${this.url}/requests/${id}/accept`, request);
  }

  listShops(): Observable<ShopSummary[]> {
    return this.http.get<ShopSummary[]>(`${this.url}/shops`);
  }
}
