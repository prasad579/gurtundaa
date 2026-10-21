import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { AdvanceFulfillmentRequest, IncomingQuotationRequest, Quote, SubmitQuoteRequest, TogglePackedItemRequest } from './models';

@Injectable({ providedIn: 'root' })
export class MarketplaceShopApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/marketplace/shop`;

  listIncoming(): Observable<IncomingQuotationRequest[]> {
    return this.http.get<IncomingQuotationRequest[]>(`${this.url}/requests`);
  }

  getIncomingDetail(id: string): Observable<IncomingQuotationRequest> {
    return this.http.get<IncomingQuotationRequest>(`${this.url}/requests/${id}`);
  }

  submitQuote(id: string, request: SubmitQuoteRequest): Observable<Quote> {
    return this.http.post<Quote>(`${this.url}/requests/${id}/quotes`, request);
  }

  listMine(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.url}/quotes`);
  }

  togglePackedItem(quoteId: string, request: TogglePackedItemRequest): Observable<Quote> {
    return this.http.post<Quote>(`${this.url}/quotes/${quoteId}/pack`, request);
  }

  advanceFulfillment(quoteId: string, request: AdvanceFulfillmentRequest): Observable<Quote> {
    return this.http.post<Quote>(`${this.url}/quotes/${quoteId}/status`, request);
  }
}
