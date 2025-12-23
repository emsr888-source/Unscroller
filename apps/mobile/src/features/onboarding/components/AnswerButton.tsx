import React, { useEffect, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';
import { RADII } from '@/core/theme/radii';
import { useHaptics } from '@/hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnswerButtonProps {
  label: string;
  index: number;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  leadingIcon?: ReactNode;
}

export function AnswerButton({
  label,
  index,
  selected = false,
  onPress,
  style,
  accessibilityLabel,
  leadingIcon,
}: AnswerButtonProps) {
  const pressScale = useSharedValue(1);
  const selectProgress = useSharedValue(selected ? 1 : 0);
  const { trigger } = useHaptics();

  useEffect(() => {
    selectProgress.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected, selectProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    backgroundColor: interpolateColor(selectProgress.value, [0, 1], ['#FFFFFF', '#1f2937']),
    borderColor: interpolateColor(selectProgress.value, [0, 1], ['rgba(31, 41, 55, 0.2)', '#1f2937']),
    shadowOpacity: 0.08 + selectProgress.value * 0.06,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectProgress.value, [0, 1], ['#1f2937', '#FFFFFF']),
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.97, { duration: 80 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { stiffness: 250, damping: 22, mass: 0.8 });
  };

  const handlePress = () => {
    trigger('light');
    onPress?.();
  };

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle, style]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View style={styles.innerContent}>
        <View
          style={[
            styles.leftRail,
            leadingIcon ? styles.leftRailWithIcon : styles.leftRailNumberOnly,
          ]}
        >
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>
          {leadingIcon ? <View style={styles.iconSlot}>{leadingIcon}</View> : null}
        </View>
        <View style={styles.labelWrapper}>
          <Animated.Text style={[styles.label, animatedTextStyle]} numberOfLines={2} ellipsizeMode="tail">
            {label}
          </Animated.Text>
        </View>
        <View
          style={[
            styles.rightRail,
            leadingIcon ? styles.rightRailWithIcon : styles.rightRailNumberOnly,
          ]}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: RADII.radius_card,
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_4,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    width: '100%',
    paddingHorizontal: SPACING.space_2,
  },
  leftRail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.space_1,
  },
  leftRailNumberOnly: {
    width: 40,
  },
  leftRailWithIcon: {
    width: 96,
  },
  rightRail: {
    height: '100%',
  },
  rightRailNumberOnly: {
    width: 40,
  },
  rightRailWithIcon: {
    width: 96,
  },
  labelWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  iconSlot: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  numberText: {
    ...TYPOGRAPHY.Body,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
