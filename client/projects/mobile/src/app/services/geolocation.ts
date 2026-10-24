import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * One-shot "where is the user right now" lookup, shared by shop-profile location capture and the
 * quotation sheet's "near me" sort. Native only uses the Capacitor plugin (needs
 * ACCESS_FINE_LOCATION/ACCESS_COARSE_LOCATION, declared in AndroidManifest.xml); falls back to the
 * browser API on web so `ionic serve` still works during development.
 */
@Injectable({ providedIn: 'root' })
export class AppGeolocation {
  private readonly native = Capacitor.isNativePlatform();
  private permissionAsked = false;

  async getCurrentPosition(): Promise<Coordinates | null> {
    try {
      if (!this.native) {
        return await this.getWebPosition();
      }
      if (!(await this.ensurePermission())) {
        return null;
      }
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000 });
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch {
      return null;
    }
  }

  private async ensurePermission(): Promise<boolean> {
    const current = await Geolocation.checkPermissions();
    if (current.location === 'granted') {
      return true;
    }
    if (this.permissionAsked) {
      return false;
    }
    this.permissionAsked = true;
    return (await Geolocation.requestPermissions()).location === 'granted';
  }

  private getWebPosition(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10_000 },
      );
    });
  }
}
