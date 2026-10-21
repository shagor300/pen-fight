import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shunneklabs.penfight.clone',
  appName: 'Pen Fight',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Haptics: {
      selection: true,
    },
    StatusBar: {
      overlaysWebView: true,
    },
    ScreenOrientation: {},
  },
};

export default config;
