import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingQuiz'>;

const HABIT_BAR_VALUES = [82, 64, 93, 58];

export default function OnboardingQuizScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const { height } = useWindowDimensions();
  const isCompact = height < 700;
  const illustrationProgress = useSharedValue(0);
  const headlineProgress = useSharedValue(0);
  const bodyProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);

  const handleStartQuiz = () => {
    navigation.navigate('QuizQuestion');
  };

  useEffect(() => {
    illustrationProgress.value = withSpring(1, {
      mass: 1,
      damping: 20,
      stiffness: 150,
    });

    headlineProgress.value = withDelay(
      100,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      }),
    );

    bodyProgress.value = withDelay(
      250,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      }),
    );

    buttonProgress.value = withDelay(
      400,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [bodyProgress, buttonProgress, headlineProgress, illustrationProgress]);

  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: illustrationProgress.value,
    transform: [
      {
        scale: 0.8 + illustrationProgress.value * 0.2,
      },
    ],
  }));

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineProgress.value,
    transform: [
      {
        translateY: (1 - headlineProgress.value) * 10,
      },
    ],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyProgress.value,
    transform: [
      {
        translateY: (1 - bodyProgress.value) * 10,
      },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [
      {
        translateY: (1 - buttonProgress.value) * 12,
      },
    ],
  }));

  return (
    <View style={styles.root}>
      <StatusBar 
        animated={true}
        barStyle="dark-content" 
        backgroundColor="#fdfbf7"
        hidden={false}
      />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.page}>

          <ScrollView
            contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.headlineContainer, headlineStyle]}>
              <Text style={styles.title}>Let's get honest about your habits</Text>
            </Animated.View>
            <Animated.View style={[styles.subheadContainer, bodyStyle]}>
              <Text style={styles.subtitle}>
                This takes about 2 minutes. At the end, you'll see how much time you're losing to scrolling and get a custom recovery plan.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.illustrationWrapper, isCompact && styles.illustrationWrapperCompact, illustrationStyle]}>
              <WatercolorCard style={[styles.illustrationPanel, isCompact && styles.illustrationPanelCompact]} backgroundColor="#fffef9" padding={SPACING.space_4}>
                <View style={styles.illustrationHeaderRow}>
                  <Text style={styles.illustrationHeaderLabel}>Habit check</Text>
                  <View style={styles.illustrationPill}>
                    <View style={styles.illustrationPillDot} />
                    <Text style={styles.illustrationPillText}>Live</Text>
                  </View>
                </View>
                <View style={styles.illustrationBars}>
                  {HABIT_BAR_VALUES.map((value, index) => (
                    <View key={value + index} style={[styles.illustrationBarTrack]}>
                      <View style={[styles.illustrationBarFill, { width: `${value}%` }]} />
                    </View>
                  ))}
                </View>
                <View style={styles.illustrationFooter}>
                  <View style={styles.illustrationFooterDot} />
                  <Text style={styles.illustrationFooterText}>Clarity trending up</Text>
                </View>
              </WatercolorCard>
            </Animated.View>
          </ScrollView>

          <Animated.View style={[styles.ctaContainer, buttonStyle]}>
            <WatercolorButton
              color="yellow"
              onPress={handleStartQuiz}
            >
              <Text style={styles.primaryCtaText}>Begin</Text>
            </WatercolorButton>
            <Text style={styles.ctaHint}>Takes under 90 seconds</Text>
          </Animated.View>
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
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: SPACING.space_4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.space_6,
    gap: SPACING.space_6,
    width: '100%',
  },
  contentCompact: {
    paddingVertical: SPACING.space_4,
    gap: SPACING.space_4,
  },
  headlineContainer: {
    width: '100%',
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 36,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 44,
  },
  subheadContainer: {
    width: '100%',
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
  },
  illustrationWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.space_5,
  },
  illustrationWrapperCompact: {
    marginVertical: SPACING.space_4,
  },
  illustrationPanel: {
    width: '100%',
    gap: SPACING.space_3,
  },
  illustrationPanelCompact: {
  },
  illustrationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  illustrationHeaderLabel: {
    fontFamily: 'PatrickHand-Regular',
    color: '#6b7280',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  illustrationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.space_2,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  illustrationPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  illustrationPillText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 13,
  },
  illustrationBars: {
    gap: SPACING.space_2,
    marginTop: SPACING.space_1,
  },
  illustrationBarTrack: {
    height: 18,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  illustrationBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  illustrationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  illustrationFooterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  illustrationFooterText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#6b7280',
    fontSize: 15,
  },
  ctaContainer: {
    paddingBottom: SPACING.space_4,
    gap: SPACING.space_3,
    width: '100%',
  },
  primaryCtaText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  ctaHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
});
