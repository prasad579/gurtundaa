import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.gurtundaa',
  appName: 'gurtundaa?',
  webDir: 'dist/mobile/browser',
  android: {
    path: 'projects/mobile/android',
  },
  ios: {
    path: 'projects/mobile/ios',
  },
  server: {
    // Dev API runs on plain http (10.0.2.2:5080). Turn this off once the API is served over https.
    cleartext: true,
  },
  plugins: {
    // Routes HttpClient through native HTTP, so the WebView doesn't hit CORS / mixed-content limits.
    CapacitorHttp: { enabled: true },
    LocalNotifications: {
      iconColor: '#7c3aed',
    },
  },
};

export default config;
