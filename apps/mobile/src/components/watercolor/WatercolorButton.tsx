import React from 'react';
import { TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WATERCOLOR_GRADIENTS } from './watercolorTheme';

type WatercolorButtonProps = {
  color?: keyof typeof WATERCOLOR_GRADIENTS;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  disabled?: boolean;
};

const WatercolorButton: React.FC<WatercolorButtonProps> = ({
  color = 'neutral',
  onPress,
  children,
  style,
  activeOpacity = 0.92,
  disabled = false,
}) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    activeOpacity={activeOpacity}
    style={[styles.wrapper, disabled && styles.wrapperDisabled, style]}
    accessibilityState={{ disabled }}
  >
    <LinearGradient
      colors={WATERCOLOR_GRADIENTS[color]}
      style={[styles.surface, disabled && styles.surfaceDisabled]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.stroke} />
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: 'rgba(14,23,45,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  wrapperDisabled: {
    opacity: 0.7,
  },
  surface: {
    borderRadius: 28,
    padding: 16,
  },
  surfaceDisabled: {
    opacity: 0.8,
  },
  stroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#1f2937',
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});

export default WatercolorButton;
