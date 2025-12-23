import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface XPToastProps {
  amount: number;
  onComplete?: () => void;
}

/**
 * XP Toast - Animated "+XP" notification
 * Shows when user earns experience points
 * Floats up and fades out
 */
export function XPToast({ amount, onComplete }: XPToastProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Animate in
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    
    // Float up
    translateY.value = withTiming(-80, { duration: 1000 });
    
    // Fade out
    opacity.value = withDelay(
      800,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ] as const,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.badge}>
        <Text style={styles.xpText}>+{amount} XP</Text>
        <Text style={styles.icon}>⚡</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 9999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(138, 43, 226, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#8a2be2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  icon: {
    fontSize: 16,
  },
});
