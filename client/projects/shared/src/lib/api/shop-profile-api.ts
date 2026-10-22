import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GURTUNDAA_API_URL } from './api-config';
import { SaveShopProfileRequest, ShopProfile, UploadShopImageResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ShopProfileApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GURTUNDAA_API_URL)}/shop/profile`;

  /** `null` means the shop hasn't saved a profile yet (hasn't finished shop onboarding). */
  get(): Observable<ShopProfile | null> {
    return this.http
      .get<ShopProfile>(this.url, { observe: 'response' })
      .pipe(map((response) => (response.status === 204 ? null : response.body)));
  }

  save(request: SaveShopProfileRequest): Observable<ShopProfile> {
    return this.http.put<ShopProfile>(this.url, request);
  }

  uploadImage(file: File): Observable<UploadShopImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadShopImageResponse>(`${this.url}/image`, formData);
  }
}
