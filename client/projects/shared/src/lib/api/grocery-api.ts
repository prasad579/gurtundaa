import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { GroceryItem, SaveGroceryItemRequest } from './models';

@Injectable({ providedIn: 'root' })
export class GroceryApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/grocery-items`;

  list(): Observable<GroceryItem[]> {
    return this.http.get<GroceryItem[]>(this.url);
  }

  create(request: SaveGroceryItemRequest): Observable<GroceryItem> {
    return this.http.post<GroceryItem>(this.url, request);
  }

  setChecked(id: string, isChecked: boolean): Observable<GroceryItem> {
    return this.http.patch<GroceryItem>(`${this.url}/${id}/checked`, { isChecked });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
