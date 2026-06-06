import type { ExpoConfig } from 'expo/config';
import appJson from './app.json';

const config = appJson.expo as ExpoConfig;

export default {
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
} satisfies ExpoConfig;
