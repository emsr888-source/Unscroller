import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { SPACING } from '@/core/theme/spacing';
import { useResetStore } from '@/features/reset/resetStore';
import { generateManifestScript } from '@/features/reset/manifestScriptService';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 240;
const RING_RADIUS = (RING_SIZE - 24) / 2;
const PROGRESS_DURATION_MS = 4200;

 type Props = NativeStackScreenProps<RootStackParamList, 'ManifestProgress'>;

type GenerationStatus = 'loading' | 'error';

export default function ManifestProgressScreen({ route, navigation }: Props) {
  const { prompt } = route.params;
  const { manifest } = useResetStore(state => ({ manifest: state.manifest }));

  const [status, setStatus] = useState<GenerationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [scriptResult, setScriptResult] = useState<{ script: string; usedFallback: boolean } | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  const progress = useSharedValue(0);

  const ringAnimatedProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * RING_RADIUS;
    const clamped = Math.min(Math.max(progress.value, 0), 1);
    return {
      strokeDashoffset: circumference * (1 - clamped),
    };
  });

  const outerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.95 + progress.value * 0.08 }],
    opacity: 0.6 + progress.value * 0.4,
  }));

  useAnimatedReaction(
    () => progress.value,
    value => {
      runOnJS(setPercent)(Math.min(100, Math.round(value * 100)));
    }
  );

  const maybeNavigate = useCallback(
    (result: { script: string; usedFallback: boolean } | null, animationFinished: boolean) => {
      if (result && animationFinished) {
        navigation.replace('ManifestSession', {
          prompt,
          script: result.script,
          usedFallback: result.usedFallback,
        });
      }
    },
    [navigation, prompt]
  );

  const startAnimation = useCallback(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: PROGRESS_DURATION_MS,
      easing: Easing.out(Easing.quad),
    }, finished => {
      if (finished) {
        runOnJS(setAnimationComplete)(true);
      }
    });
  }, [progress]);

  const runGeneration = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    setScriptResult(null);
    setAnimationComplete(false);
    startAnimation();

    try {
      const result = await generateManifestScript({
        prompt,
        durationMin: manifest.lastDurationMin,
        voice: manifest.lastVoice,
        speechRate: manifest.lastSpeechRate,
      });
      setScriptResult(result);
      maybeNavigate(result, false);
    } catch (error) {
      console.warn('[ManifestProgress] generation failed', error);
      setStatus('error');
      setErrorMessage('We hit a snag while crafting your story. Try again in a moment.');
    }
  }, [manifest.lastDurationMin, manifest.lastSpeechRate, manifest.lastVoice, maybeNavigate, prompt, startAnimation]);

  useEffect(() => {
    runGeneration();
  }, [runGeneration]);

  useEffect(() => {
    if (scriptResult && animationComplete) {
      navigation.replace('ManifestSession', {
        prompt,
        script: scriptResult.script,
        usedFallback: scriptResult.usedFallback,
      });
    }
  }, [animationComplete, navigation, prompt, scriptResult]);

  const hintText = useMemo(() => {
    if (status === 'error') {
      return errorMessage ?? 'Unable to generate right now.';
    }
    if (percent < 30) {
      return 'Gathering a calming narrative...';
    }
    if (percent < 70) {
      return 'Painting the details of your visualization...';
    }
    return 'Smoothing cadence and tone...';
  }, [errorMessage, percent, status]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityRole="button">
              <Text style={styles.iconLabel}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manifesting</Text>
            <View style={styles.iconGhost} />
          </View>

          <WatercolorCard style={styles.progressCard} backgroundColor="#fffaf0" padding={SPACING.space_3}>
            <Animated.View style={[styles.ringWrapper, outerAnimatedStyle]}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="rgba(15, 23, 42, 0.15)"
                  strokeWidth={12}
                  fill="none"
                />
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="#a855f7"
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={2 * Math.PI * RING_RADIUS}
                  animatedProps={ringAnimatedProps}
                />
              </Svg>
              <View style={styles.ringContent}>
                <Text style={styles.percentText}>{percent}%</Text>
                <Text style={styles.percentLabel}>Vision loading</Text>
              </View>
            </Animated.View>
            <Text style={styles.promptLabel}>Your intention</Text>
            <Text style={styles.promptPreview} numberOfLines={3}>
              “{prompt}”
            </Text>
            <Text style={styles.statusText}>{hintText}</Text>
          </WatercolorCard>

          {status === 'error' ? (
            <WatercolorButton color="red" onPress={runGeneration} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </WatercolorButton>
          ) : (
            <Text style={styles.footer}>Stay with your breath while we compose your narration.</Text>
          )}
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_4,
    gap: SPACING.space_3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 24,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  iconGhost: {
    width: 44,
    height: 44,
  },
  progressCard: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.space_2,
  },
  ringContent: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  percentText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 34,
    color: '#1f2937',
  },
  percentLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  promptLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  promptPreview: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
  },
  statusText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.space_2,
  },
  retryButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  footer: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
});
