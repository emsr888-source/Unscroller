/**
 * Premium Button Component
 * Animated button with press/hover states, focus rings, and haptic feedback
 */

import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, TextStyle, AccessibilityRole } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationDuration, AnimationEasing, Transform, Colors, Border, Shadow, Accessibility } from '../constants/design';
import { COLORS } from '@/core/theme/colors';
import { useHaptics } from '../hooks/useHaptics';

interface PremiumButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function PremiumButton({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PremiumButtonProps) {
  const { trigger } = useHaptics();
  const pressScale = useSharedValue(1);
  const focusOpacity = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      pressScale.value = withSpring(Transform.press, AnimationEasing.spring);
      trigger('light');
    }
  }, [disabled, pressScale, trigger]);

  const handlePressOut = useCallback(() => {
    if (!disabled) {
      pressScale.value = withSpring(1, AnimationEasing.spring);
    }
  }, [disabled, pressScale]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress();
    }
  }, [disabled, onPress]);

  const handleFocus = useCallback(() => {
    focusOpacity.value = withTiming(1, { duration: AnimationDuration.micro });
  }, [focusOpacity]);

  const handleBlur = useCallback(() => {
    focusOpacity.value = withTiming(0, { duration: AnimationDuration.micro });
  }, [focusOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
      opacity: disabled ? 0.5 : 1,
    };
  });

  const focusRingStyle = useAnimatedStyle(() => {
    return {
      opacity: focusOpacity.value,
    };
  });

  const sizeStyles = {
    small: styles.smallButton,
    medium: styles.mediumButton,
    large: styles.largeButton,
  }[size];

  const textSizeStyles = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  }[size];

  const textColor = variant === 'primary' ? '#ffffff' : COLORS.ACCENT_GRADIENT_START;

  const content = (
    <>
      {icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
      <Text style={[styles.text, textSizeStyles, { color: textColor }, textStyle]}>{title}</Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <AnimatedTouchable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        activeOpacity={1}
        disabled={disabled}
        accessible
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole={accessibilityRole}
        style={[styles.container, sizeStyles, style, animatedStyle]}
      >
        <AnimatedLinearGradient
          colors={[...Colors.primary.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {content}
        </AnimatedLinearGradient>
        <Animated.View style={[styles.focusRing, focusRingStyle]} />
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      activeOpacity={1}
      disabled={disabled}
      accessible
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole={accessibilityRole}
      style={[
        styles.container,
        sizeStyles,
        variant === 'secondary' ? styles.secondary : styles.ghost,
        style,
        animatedStyle,
      ]}
    >
      {content}
      <Animated.View style={[styles.focusRing, focusRingStyle]} />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Border.radius.medium,
    overflow: 'hidden',
    ...Shadow.combined,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: '100%',
  },
  secondary: {
    backgroundColor: Colors.surface.card,
    borderWidth: Border.hairline,
    borderColor: Colors.surface.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghost: {
    backgroundColor: 'rgba(77, 161, 255, 0.08)',
    borderWidth: Border.hairline,
    borderColor: 'rgba(77, 161, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: Accessibility.minHitTarget,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: Accessibility.minHitTarget,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: Accessibility.minHitTarget,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 13,
    lineHeight: 18,
  },
  mediumText: {
    fontSize: 15,
    lineHeight: 21,
  },
  largeText: {
    fontSize: 16,
    lineHeight: 22,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRing: {
    position: 'absolute',
    top: -Border.focusRing,
    left: -Border.focusRing,
    right: -Border.focusRing,
    bottom: -Border.focusRing,
    borderRadius: Border.radius.medium + Border.focusRing,
    borderWidth: Border.focusRing,
    borderColor: Colors.focus,
    pointerEvents: 'none',
  },
});
