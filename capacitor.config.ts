import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.endevina.partit',
  appName: 'Endevina el partit',
  webDir: '.next',
  "server": {
    "url": process.env.WEB_URL,
    "cleartext": true
  }
};

export default config;
