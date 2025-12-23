/**
 * Haptics Hook
 * Provides haptic feedback for mobile interactions
 * 
 * Note: To enable haptics, install react-native-haptic-feedback:
 * npm install react-native-haptic-feedback
 */

import { useCallback } from 'react';
import { Platform, Vibration } from 'react-native';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const vibrationPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 10],
  warning: [20, 30, 20],
  error: [50, 100, 50],
};

export function useHaptics() {
  const trigger = useCallback((type: HapticType = 'light') => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    try {
      const pattern = vibrationPatterns[type];
      if (Array.isArray(pattern)) {
        Vibration.vibrate(pattern);
      } else {
        Vibration.vibrate(pattern);
      }
    } catch (error) {
      // Silently fail if haptics/vibration are not available
      console.debug('Haptics not available:', error);
    }
  }, []);

  return { trigger };
}
