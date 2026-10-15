import { Capacitor } from '@capacitor/core';

// The Android emulator reaches the host machine on 10.0.2.2, not localhost.
// On a real phone, change this to your PC's LAN IP (and allow it through the firewall).
const host = Capacitor.getPlatform() === 'android' ? '10.0.2.2' : 'localhost';

export const environment = {
  apiUrl: `http://${host}:5080/api`,
};
