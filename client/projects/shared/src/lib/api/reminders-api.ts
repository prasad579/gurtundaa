import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { Reminder, ReminderFilter, ReminderStats, SaveReminderRequest } from './models';

@Injectable({ providedIn: 'root' })
export class RemindersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/reminders`;

  list(filter: ReminderFilter = 'All'): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(this.url, { params: new HttpParams().set('filter', filter) });
  }

  stats(): Observable<ReminderStats> {
    return this.http.get<ReminderStats>(`${this.url}/stats`);
  }

  create(request: SaveReminderRequest): Observable<Reminder> {
    return this.http.post<Reminder>(this.url, request);
  }

  update(id: string, request: SaveReminderRequest): Observable<Reminder> {
    return this.http.put<Reminder>(`${this.url}/${id}`, request);
  }

  setDone(id: string, value: boolean): Observable<Reminder> {
    return this.http.patch<Reminder>(`${this.url}/${id}/done`, null, {
      params: new HttpParams().set('value', value),
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
