import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const appOwnership = Constants?.appOwnership ?? null;
const executionEnvironment = Constants?.executionEnvironment ?? null;

export const isExpoStoreClient =
  appOwnership === 'expo' || executionEnvironment === ExecutionEnvironment.StoreClient;

export const hasCustomNativeModules = !isExpoStoreClient;
export const isNativeBlockServiceAvailable = hasCustomNativeModules;
export const isScreenTimeSupported = hasCustomNativeModules && Platform.OS === 'ios';
export const isAndroidBlockerSupported = hasCustomNativeModules && Platform.OS === 'android';

export const explainNativeLimitation = (feature: string) =>
  `[Native] ${feature} unavailable in Expo Go runtime. Use a development build or stand-alone app to enable it.`;
