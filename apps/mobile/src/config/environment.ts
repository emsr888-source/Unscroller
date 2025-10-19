import { Platform } from 'react-native';

/**
 * Environment configuration for Creator Mode mobile app
 * Handles API URLs for different environments and platforms
 */

// Determine if we're in development mode
const isDevelopment = __DEV__;

/**
 * Get the appropriate API URL based on environment and platform
 */
function getApiUrl(): string {
  if (isDevelopment) {
    // Development mode - use localhost on port 3001 (backend is running there)
    if (Platform.OS === 'ios') {
      // iOS Simulator uses localhost
      return 'http://localhost:3001';
    } else if (Platform.OS === 'android') {
      // Android Emulator uses special IP for host machine
      return 'http://10.0.2.2:3001';
    }
    // For physical devices in development, use your computer's IP
    // You can set this via environment variable:
    // REACT_APP_DEV_API_URL=http://192.168.1.100:3001
    return process.env.REACT_APP_DEV_API_URL || 'http://localhost:3001';
  }

  // Production mode - use production API
  return process.env.REACT_APP_API_URL || 'https://api.creatormode.app';
}

/**
 * Environment configuration object
 */
export const CONFIG = {
  // API Configuration
  API_URL: getApiUrl(),
  
  // Supabase Configuration
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_KEY || 'your-anon-key',
  
  // RevenueCat Configuration
  REVENUECAT_API_KEY_IOS: process.env.REACT_APP_REVENUECAT_IOS || 'your-ios-key',
  REVENUECAT_API_KEY_ANDROID: process.env.REACT_APP_REVENUECAT_ANDROID || 'your-android-key',
  
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
  console.log('🔧 Creator Mode Configuration:', {
    Platform: Platform.OS,
    API_URL: CONFIG.API_URL,
    Environment: isDevelopment ? 'Development' : 'Production',
  });
}

export default CONFIG;

