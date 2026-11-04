import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { AssistantReply } from './models';

@Injectable({ providedIn: 'root' })
export class AssistantApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/assistant`;

  sendCommand(text: string): Observable<AssistantReply> {
    return this.http.post<AssistantReply>(`${this.url}/command`, { text });
  }
}
