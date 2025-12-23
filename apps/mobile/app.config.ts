import { ExpoConfig, ConfigContext } from '@expo/config';
import path from 'path';

const ICON_PATH = './assets/icon.png';
const SPLASH_PATH = './assets/splash.png';

const resolveAsset = (relativePath: string) => path.resolve(__dirname, relativePath);

// We commit the android/ and ios/ folders while still treating app.config.ts as the
// source of truth. Remember to re-run `expo prebuild` after any native config change.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Unscroller',
  slug: 'unscroller',
  scheme: 'unscroller',
  version: '1.0.0',
  orientation: 'portrait',
  owner: config.owner,
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  newArchEnabled: true,
  splash: {
    image: resolveAsset(SPLASH_PATH),
    resizeMode: 'cover',
    backgroundColor: '#000000',
  },
  icon: resolveAsset(ICON_PATH),
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'org.name.CreatorMode',
    infoPlist: {
      UIViewControllerBasedStatusBarAppearance: true,
    },
  },
  android: {
    package: 'com.unscroller',
    adaptiveIcon: {
      foregroundImage: resolveAsset(ICON_PATH),
      backgroundColor: '#000000',
    },
  },
  plugins: [
    'expo-apple-authentication',
    'expo-notifications',
    'expo-secure-store',
  ],
  extra: {
    eas: {
      projectId: config.extra?.eas?.projectId ?? '1d17dd60-4773-44e3-849c-80ab99b4be3e',
    },
    // expose environment variables with EXPO_PUBLIC_ prefix
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? process.env.REACT_APP_API_URL ?? '',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.REACT_APP_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? process.env.REACT_APP_SUPABASE_KEY ?? '',
    googleWebClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID ?? '',
    iosIapAnnual: process.env.EXPO_PUBLIC_IOS_IAP_ANNUAL ?? process.env.REACT_APP_IOS_IAP_ANNUAL ?? '',
    iosIapMonthly: process.env.EXPO_PUBLIC_IOS_IAP_MONTHLY ?? process.env.REACT_APP_IOS_IAP_MONTHLY ?? '',
    androidIapAnnual:
      process.env.EXPO_PUBLIC_ANDROID_IAP_ANNUAL ?? process.env.REACT_APP_ANDROID_IAP_ANNUAL ?? '',
    androidIapMonthly:
      process.env.EXPO_PUBLIC_ANDROID_IAP_MONTHLY ?? process.env.REACT_APP_ANDROID_IAP_MONTHLY ?? '',
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
});
