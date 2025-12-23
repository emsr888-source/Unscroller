import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Provides the user's reduced motion accessibility preference.
 */
export function useReducedMotion(): boolean {
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (isMounted) {
        setIsReduced(value);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value: boolean) => setIsReduced(value),
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return isReduced;
}
