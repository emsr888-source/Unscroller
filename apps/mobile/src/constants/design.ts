/**
 * Premium Design System
 * Defines motion, typography, shadows, and visual constants
 */

import { Easing } from 'react-native-reanimated';

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const AnimationDuration = {
  micro: 120,
  standard: 180,
  overlay: 220,
  sheen: 8000, // For gradient sheen effect
} as const;

export const AnimationEasing = {
  // Default premium easing
  premium: Easing.bezier(0.2, 0.8, 0.2, 1),
  
  // Spring config for interactive elements
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  
  // Gentle ease out
  out: Easing.out(Easing.cubic),
  
  // Gentle ease in
  in: Easing.in(Easing.cubic),
} as const;

export const AnimationStagger = {
  list: 30,
  card: 40,
} as const;

// ============================================================================
// TRANSFORMS
// ============================================================================

export const Transform = {
  press: 0.98,
  hover: 1.03,
  overshoot: 1.03,
  pageSlide: 8,
  modalSlide: 16,
  toastSlide: 6,
  parallax: {
    min: 2,
    max: 4,
  },
  tilt: 2, // degrees
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  size: {
    h1: 28,
    h2: 22,
    body: 16,
    small: 13,
  },
  lineHeight: {
    heading: 1.2,
    body: 1.4,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.3,
  },
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadow = {
  // Two-layer shadow system
  ambient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  key: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  combined: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ============================================================================
// BORDERS
// ============================================================================

export const Border = {
  hairline: 1,
  focusRing: 2,
  radius: {
    small: 12,
    medium: 16,
    large: 24,
  },
} as const;

// ============================================================================
// OPACITY
// ============================================================================

export const Opacity = {
  scrim: {
    from: 0.12,
    to: 0.18,
  },
  disabled: 0.5,
  subtle: 0.8,
} as const;

// ============================================================================
// COLORS
// ============================================================================

export const Colors = {
  primary: {
    gradient: ['#4DA1FF', '#7AE1C3'], // breezy blue → mint
  },
  surface: {
    card: 'rgba(255, 255, 255, 0.92)',
    cardBorder: 'rgba(20, 30, 40, 0.08)',
    cardHighlight: 'rgba(77, 161, 255, 0.08)',
  },
  focus: '#4DA1FF',
  success: '#1FBF8E',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const Accessibility = {
  minHitTarget: 44,
  minContrast: 4.5, // WCAG AA
} as const;

// ============================================================================
// HAPTICS
// ============================================================================

export const HapticFeedback = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
} as const;
