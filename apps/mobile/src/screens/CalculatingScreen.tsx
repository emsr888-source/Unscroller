import React, { useEffect, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Calculating'>;

export default function CalculatingScreen({ navigation }: Props) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const statusMessages = ['Analyzing your habits…', 'Building your custom plan…'];

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(Math.round(value));
    });

    const statusTimer = setTimeout(() => setStatusIndex(1), 1500);
    const navTimer = setTimeout(() => navigation.navigate('OnboardingQuizResult'), 3300);

    return () => {
      progressAnim.removeListener(listenerId);
      clearTimeout(statusTimer);
      clearTimeout(navTimer);
    };
  }, [navigation, progressAnim]);

  const firstHalfRotation = progressAnim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '180deg', '180deg'],
  });

  const secondHalfRotation = progressAnim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <View style={styles.content}>
        <View style={styles.progressWrapper}>
          <View style={styles.circleBase} />
          <View style={styles.halvesContainer}>
            <Animated.View style={[styles.halfCircle, styles.leftHalf, { transform: [{ rotate: firstHalfRotation }] }]} />
            <Animated.View style={[styles.halfCircle, styles.rightHalf, { transform: [{ rotate: secondHalfRotation }] }]} />
          </View>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{progress}%</Text>
          </View>
        </View>

        <Text style={styles.headline}>Calculating your plan</Text>
        <Text style={styles.statusText}>{statusMessages[statusIndex]}</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_6,
    gap: SPACING.space_5,
  },
  progressWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 220,
    height: 220,
  },
  circleBase: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 12,
    borderColor: COLORS.GLASS_BORDER,
    opacity: 0.35,
  },
  halvesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  halfCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 12,
    borderColor: 'transparent',
  },
  leftHalf: {
    borderLeftColor: COLORS.ACCENT_GRADIENT_START,
    borderTopColor: COLORS.ACCENT_GRADIENT_START,
    borderBottomColor: COLORS.ACCENT_GRADIENT_START,
    transform: [{ rotate: '-135deg' }],
  },
  rightHalf: {
    borderRightColor: COLORS.ACCENT_GRADIENT_END,
    borderTopColor: COLORS.ACCENT_GRADIENT_END,
    borderBottomColor: COLORS.ACCENT_GRADIENT_END,
    transform: [{ rotate: '-135deg' }],
  },
  percentageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  headline: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  statusText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
