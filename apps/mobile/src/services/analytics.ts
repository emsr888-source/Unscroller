import { CONFIG } from '@/config/environment';

// Simple analytics abstraction. Replace implementation when real analytics SDK is available.
export const analytics = {
  track(eventName: string, payload?: Record<string, unknown>) {
    if (!CONFIG.ENABLE_ANALYTICS) {
      return;
    }

    if (__DEV__) {
      console.log(`[Analytics] ${eventName}`, payload ?? {});
    }

    // TODO: integrate with actual analytics provider (Segment, Amplitude, etc.)
  },
};
