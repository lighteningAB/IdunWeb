import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idun.app',
  appName: 'IDUN',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
