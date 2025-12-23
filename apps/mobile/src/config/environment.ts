import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Environment configuration for Unscroller mobile app
 * Handles API URLs for different environments and platforms
 */

// Determine if we're in development mode
const isDevelopment = __DEV__;

type ExpoExtra = {
  apiUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleWebClientId?: string;
  iosIapAnnual?: string;
  iosIapMonthly?: string;
  androidIapAnnual?: string;
  androidIapMonthly?: string;
  devBypassUserId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

/**
 * Get the appropriate API URL based on environment and platform.
 * Prioritises Expo extra values, then environment variables, finally local defaults.
 */
function getApiUrl(): string {
  const envApiUrl =
    extra.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    undefined;

  if (envApiUrl) {
    return envApiUrl;
  }

  if (isDevelopment) {
    // Mobile simulator/device needs to hit the Nest backend which defaults to port 3001.
    if (Platform.OS === 'ios') {
      return 'http://localhost:3001';
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001';
    }
    return process.env.EXPO_PUBLIC_DEV_API_URL || process.env.REACT_APP_DEV_API_URL || 'http://localhost:3001';
  }

  return 'https://api.unscroller.app';
}

/**
 * Environment configuration object
 */
export const CONFIG = {
  // API Configuration
  API_URL: getApiUrl(),
  
  // Supabase Configuration - Unscroller Database
  SUPABASE_URL:
    extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '',
  SUPABASE_ANON_KEY:
    extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY || '',
  
  // Google Sign-In Configuration
  GOOGLE_WEB_CLIENT_ID:
    extra.googleWebClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID ||
    '',

  // In-App Purchase product identifiers
  IOS_IAP_ANNUAL_PRODUCT_ID:
    extra.iosIapAnnual || process.env.EXPO_PUBLIC_IOS_IAP_ANNUAL || process.env.REACT_APP_IOS_IAP_ANNUAL || '',
  IOS_IAP_MONTHLY_PRODUCT_ID:
    extra.iosIapMonthly || process.env.EXPO_PUBLIC_IOS_IAP_MONTHLY || process.env.REACT_APP_IOS_IAP_MONTHLY || '',
  ANDROID_IAP_ANNUAL_PRODUCT_ID:
    extra.androidIapAnnual ||
    process.env.EXPO_PUBLIC_ANDROID_IAP_ANNUAL ||
    process.env.REACT_APP_ANDROID_IAP_ANNUAL ||
    '',
  ANDROID_IAP_MONTHLY_PRODUCT_ID:
    extra.androidIapMonthly ||
    process.env.EXPO_PUBLIC_ANDROID_IAP_MONTHLY ||
    process.env.REACT_APP_ANDROID_IAP_MONTHLY ||
    '',

  // Developer helpers
  DEV_BYPASS_USER_ID:
    extra.devBypassUserId ||
    process.env.EXPO_PUBLIC_DEV_BYPASS_USER_ID ||
    process.env.REACT_APP_DEV_BYPASS_USER_ID ||
    (isDevelopment ? 'dev_user_maya' : ''),

  // Feature Flags
  ENABLE_AI_FEATURES: process.env.REACT_APP_ENABLE_AI === 'true',
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS !== 'false', // enabled by default
  
  // Debug Settings
  DEBUG_MODE: isDevelopment && process.env.REACT_APP_DEBUG === 'true',
  LOG_API_CALLS: isDevelopment,
};

/**
 * Log configuration on startup (development only)
 */
if (isDevelopment && CONFIG.DEBUG_MODE) {
  console.log('🔧 Unscroller Configuration:', {
    Platform: Platform.OS,
    API_URL: CONFIG.API_URL,
    Environment: isDevelopment ? 'Development' : 'Production',
    DEV_BYPASS_USER_ID: CONFIG.DEV_BYPASS_USER_ID,
  });
}

export default CONFIG;
