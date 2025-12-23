import { useCallback } from 'react';
import { Platform, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isExpoGo } from '@/utils/isExpoGo';

/**
 * Hook to force status bar style on screen focus.
 * Use this on screens where StatusBar component doesn't work properly.
 */
export function useStatusBarStyle(style: 'light-content' | 'dark-content' = 'dark-content') {
  useFocusEffect(
    useCallback(() => {
      if (isExpoGo) {
        // Expo Go does not allow changing status bar appearance; avoid crashing.
        return;
      }
      StatusBar.setBarStyle(style, true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(style === 'dark-content' ? '#fdfbf7' : '#000000', true);
      }
    }, [style])
  );
}
