import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { RootStackParamList } from '@/navigation/AppNavigator';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';

const ROTATION_DURATION = 5200;
const PULSE_DURATION = 2000;
const FORWARD_DELAY = 2600;

const ORBIT_RADIUS = 78;
const VISUAL_SIZE = 220;

const WAITING_MESSAGES = [
  'Synthesizing your signals...',
  'Mapping symptoms to routines...',
  'Tailoring the next phase...',
];

type Props = NativeStackScreenProps<RootStackParamList, 'QuizResultLoading'>;

export default function QuizResultLoadingScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const messageIndex = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: ROTATION_DURATION, easing: Easing.linear }),
      -1,
      false,
    );

    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    const messageTimer = setInterval(() => {
      messageIndex.value = (messageIndex.value + 1) % WAITING_MESSAGES.length;
    }, 1800);

    const timeout = setTimeout(() => {
      navigation.replace('OnboardingQuizResult');
    }, FORWARD_DELAY);

    return () => {
      clearInterval(messageTimer);
      clearTimeout(timeout);
    };
  }, [navigation, messageIndex, pulse, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.06 }],
  }));

  const orbitStyle = useAnimatedStyle<ViewStyle>(() => {
    const radians = (rotation.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: Math.cos(radians) * ORBIT_RADIUS },
        { translateY: Math.sin(radians) * ORBIT_RADIUS },
      ] as ViewStyle['transform'],
    };
  });

  const subtextStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + 0.4 * pulse.value,
  }));

  const statusStyle = useAnimatedStyle(() => ({
    opacity: 0.8 + 0.2 * pulse.value,
  }));

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.visualStack}>
          <Animated.View style={[styles.pulseRing, glowStyle]} />
          <Animated.View style={[styles.secondaryRing, ringStyle]} />
          <Animated.View style={[styles.orbitDot, orbitStyle]} />
          <View style={styles.centerCore}>
            <Text style={styles.coreText}>Calibrating</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Animated.Text style={[styles.headline, statusStyle]}>Designing your detox blueprint…</Animated.Text>
          <Animated.Text style={[styles.subtext, subtextStyle]}>
            {WAITING_MESSAGES[messageIndex.value]}
          </Animated.Text>
        </View>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_5,
  },
  visualStack: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
    borderRadius: VISUAL_SIZE / 2,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  secondaryRing: {
    position: 'absolute',
    width: VISUAL_SIZE - 24,
    height: VISUAL_SIZE - 24,
    borderRadius: (VISUAL_SIZE - 24) / 2,
    borderWidth: 2,
    borderColor: '#1f2937',
    borderStyle: 'dashed',
  },
  orbitDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fbbf24',
    top: '50%',
    left: '50%',
    marginLeft: -7,
    marginTop: -7,
  },
  centerCore: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  coreText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#fffef9',
    letterSpacing: 2,
  },
  textBlock: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  headline: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: SPACING.space_4,
  },
});
