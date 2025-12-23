/**
 * Premium Card Component
 * Elevated card with proper shadows, borders, and subtle animations
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AnimationEasing, Transform, Colors, Border, Shadow } from '../constants/design';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
}

export function PremiumCard({ children, style, pressable = false, onPress }: PremiumCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(Transform.press, AnimationEasing.spring);
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1, AnimationEasing.spring);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (pressable && onPress) {
    return (
      <Animated.View
        style={[styles.card, style, animatedStyle]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
      >
        {children}
      </Animated.View>
    );
  }

  return <Animated.View style={[styles.card, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Border.radius.medium,
    borderWidth: Border.hairline,
    borderColor: Colors.surface.cardBorder,
    padding: 16,
    ...Shadow.combined,
    // Subtle inner highlight for crispness
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.02,
  },
});
