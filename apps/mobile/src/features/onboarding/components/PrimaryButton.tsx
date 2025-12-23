import React, { forwardRef, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { RADII } from '@/core/theme/radii';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type PrimaryButtonVariant = 'default' | 'outline';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: PrimaryButtonVariant;
  accessibilityLabel?: string;
}

export const PrimaryButton = forwardRef<LinearGradient, PrimaryButtonProps>(function PrimaryButton(
  { title, onPress, disabled = false, style, textStyle, variant = 'default', accessibilityLabel }: PrimaryButtonProps,
  ref,
) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const gradientColors = useMemo<readonly [string, string]>(() => {
    if (variant === 'outline') {
      return ['transparent', 'transparent'];
    }
    return ['#0B0B0B', '#0B0B0B'];
  }, [variant]);

  const animatedStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      opacity: disabled ? 0.6 : 1,
      transform: reducedMotion ? [] : [{ scale }],
    }),
    [disabled, reducedMotion, scale],
  );

  const handlePressIn = () => {
    if (disabled || reducedMotion) return;
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      damping: 15,
      stiffness: 220,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };

  return (
    <Animated.View
      style={[
        styles.button,
        variant === 'outline' && styles.outlineButton,
        style,
        animatedStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.pressable}
      >
        <LinearGradient
          ref={ref}
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
          pointerEvents="none"
        />
        <Text style={[styles.title, variant === 'outline' && styles.outlineText, textStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: RADII.radius_button,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 20, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
    width: '100%',
    alignSelf: 'stretch',
  },
  pressable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.radius_button,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowOpacity: 0.04,
  },
  title: {
    ...TYPOGRAPHY.Button,
    color: '#FFFFFF',
  },
  outlineText: {
    color: COLORS.TEXT_PRIMARY,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADII.radius_button,
    opacity: 1,
  },
});
