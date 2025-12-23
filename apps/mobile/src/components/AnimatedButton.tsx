/**
 * Animated Button Wrapper
 * Adds press animations and haptic feedback to TouchableOpacity
 */

import React, { useCallback } from 'react';
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { AnimationEasing, Transform } from '../constants/design';
import { useHaptics } from '../hooks/useHaptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  enableHaptic?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
  scaleOnPress?: boolean;
}

export function AnimatedButton({
  children,
  onPress,
  onPressIn,
  onPressOut,
  enableHaptic = true,
  hapticType = 'light',
  scaleOnPress = true,
  style,
  ...rest
}: AnimatedButtonProps) {
  const haptics = useHaptics();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback((event: GestureResponderEvent) => {
    if (scaleOnPress && !reducedMotion) {
      scale.value = withSpring(Transform.press, AnimationEasing.spring);
    }
    if (enableHaptic) {
      haptics.trigger(hapticType);
    }
    onPressIn?.(event);
  }, [scaleOnPress, reducedMotion, scale, enableHaptic, haptics, hapticType, onPressIn]);

  const handlePressOut = useCallback((event: GestureResponderEvent) => {
    if (scaleOnPress && !reducedMotion) {
      scale.value = withSpring(1, AnimationEasing.spring);
    }
    onPressOut?.(event);
  }, [scaleOnPress, reducedMotion, scale, onPressOut]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!scaleOnPress || reducedMotion) {
      return {};
    }
    return {
      transform: [{ scale: scale.value }],
    };
  }, [scaleOnPress, reducedMotion]);

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      activeOpacity={0.9}
      {...rest}
    >
      {children}
    </AnimatedTouchable>
  );
}
