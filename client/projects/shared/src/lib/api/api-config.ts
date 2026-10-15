import { InjectionToken } from '@angular/core';

/** Base URL of the Gurtundaa API, e.g. `http://localhost:5080/api`. Each app provides its own. */
export const GURTUNDAA_API_URL = new InjectionToken<string>('GURTUNDAA_API_URL');
