import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import { SPACING } from '@/core/theme/spacing';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const PROGRESS_SIZE = 220;
const PROGRESS_STROKE_WIDTH = 12;
const PROGRESS_RADIUS = (PROGRESS_SIZE - PROGRESS_STROKE_WIDTH) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

type Props = NativeStackScreenProps<RootStackParamList, 'PlanPreview'>;

export default function PlanPreviewScreen({ navigation }: Props) {
  const {
    firstName,
    hoursPerDay,
    symptomsSelected,
    biggestStruggle,
    reclaimTimeFocus,
    supportNeed,
  } = useOnboardingAssessment();

  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const statusMessages = useMemo(() => {
    const messages: string[] = [];
    
    if (hoursPerDay !== null) {
      messages.push(`Mapping ${Math.round(hoursPerDay * 7)}h/week time recovery plan`);
    }
    if (symptomsSelected.length > 0) {
      messages.push(`Calibrating ${symptomsSelected.length} symptom relief routines`);
    }
    if (biggestStruggle) {
      messages.push('Targeting your biggest pain points first');
    }
    if (reclaimTimeFocus) {
      messages.push('Architecting focus windows for your goals');
    }
    if (supportNeed) {
      messages.push('Loading the guardrails you requested');
    }
    
    messages.push('Finalizing your custom roadmap');
    
    return messages.length > 0 ? messages : ['Crafting your personalized plan'];
  }, [hoursPerDay, symptomsSelected, biggestStruggle, reclaimTimeFocus, supportNeed]);

  const headline = useMemo(() => {
    const name = firstName?.trim();
    if (name) {
      return `${name}, we're building your reset`;
    }
    return 'Building your custom reset';
  }, [firstName]);

  const subtitle = useMemo(() => {
    if (reclaimTimeFocus) {
      const focusMap: Record<string, string> = {
        side_hustle: 'building something of your own',
        content: 'shipping meaningful content',
        study: 'upskilling faster',
        mental_health: 'feeling lighter and clearer',
        loved_ones: 'being present with people who matter',
      };
      const focus = focusMap[reclaimTimeFocus] || 'your most important work';
      return `We're calibrating guardrails so you can reclaim time for ${focus}.`;
    }
    return 'Your personalized plan is seconds away.';
  }, [reclaimTimeFocus]);

  const handleContinue = useCallback(() => {
    navigation.navigate('CustomPlan');
  }, [navigation]);

  useEffect(() => {
    progressAnim.setValue(0);
    setProgress(0);
    setStatusIndex(0);

    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(Math.min(100, Math.round(value)));
    });

    const animation = Animated.timing(progressAnim, {
      toValue: 100,
      duration: 4500,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleContinue();
      }
    });

    const statusInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statusMessages.length);
    }, 1200);

    return () => {
      progressAnim.removeListener(listenerId);
      animation.stop();
      clearInterval(statusInterval);
    };
  }, [progressAnim, handleContinue, statusMessages.length]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [PROGRESS_CIRCUMFERENCE, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Reanimated.View entering={FadeInUp.duration(400)} style={styles.headerBlock}>
          <Text style={styles.eyebrow}>Personalizing your journey</Text>
          <Text style={styles.headline}>{headline}</Text>
        </Reanimated.View>

        <View style={styles.progressWrapper}>
          <Svg width={PROGRESS_SIZE} height={PROGRESS_SIZE}>
            <Circle
              cx={PROGRESS_SIZE / 2}
              cy={PROGRESS_SIZE / 2}
              r={PROGRESS_RADIUS}
              stroke="#e5e7eb"
              strokeWidth={PROGRESS_STROKE_WIDTH}
              opacity={0.35}
              fill="none"
            />
            <AnimatedCircle
              cx={PROGRESS_SIZE / 2}
              cy={PROGRESS_SIZE / 2}
              r={PROGRESS_RADIUS}
              stroke="#fbbf24"
              strokeWidth={PROGRESS_STROKE_WIDTH}
              strokeDasharray={PROGRESS_CIRCUMFERENCE.toString()}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              originX={PROGRESS_SIZE / 2}
              originY={PROGRESS_SIZE / 2}
            />
          </Svg>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{progress}%</Text>
          </View>
        </View>

        <View style={styles.statusBlock}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{statusMessages[statusIndex]}</Text>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_5,
  },
  headerBlock: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  eyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  progressWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  percentageContainer: {
    position: 'absolute',
    width: PROGRESS_SIZE,
    height: PROGRESS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 48,
    color: '#1f2937',
  },
  headline: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 40,
  },
  statusBlock: {
    alignItems: 'center',
    gap: SPACING.space_3,
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  statusText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  subtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: SPACING.space_2,
  },
});
