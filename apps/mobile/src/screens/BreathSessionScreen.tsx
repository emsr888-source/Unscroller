import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { SPACING } from '@/core/theme/spacing';
import { BREATH_PRESETS, getPresetById } from '@/features/reset/breathPresets';
import { BreathEngine, BreathEngineSnapshot } from '@/features/reset/BreathEngine';
import { useResetStore } from '@/features/reset/resetStore';
import type { BreathPreset, SessionLengthMinutes } from '@/features/reset/types';
import { useHaptics } from '@/hooks/useHaptics';
import TriangleBreathPath from '@/components/TriangleBreathPath';
import { breathAudioCueService } from '@/features/reset/breathAudioCues';
import type { BreathPhaseType } from '@/features/reset/breathAudioCues';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 280;
const RING_RADIUS = (RING_SIZE - 24) / 2;
const SESSION_LENGTHS: SessionLengthMinutes[] = [3, 5, 7, 10, 15];

type Props = NativeStackScreenProps<RootStackParamList, 'BreathSession'>;

export default function BreathSessionScreen({ route, navigation }: Props) {
  const { presetId: initialPresetId } = route.params;
  const haptics = useHaptics();
  const { breath, setBreathPreferences, logSession } = useResetStore(
    useCallback(
      state => ({
        breath: state.breath,
        setBreathPreferences: state.setBreathPreferences,
        logSession: state.logSession,
      }),
      []
    )
  );

  const [presetId, setPresetId] = useState<string>(initialPresetId);
  const [sessionMinutes, setSessionMinutes] = useState<SessionLengthMinutes>(breath.lastDuration ?? 5);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(breath.hapticsEnabled);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState<boolean>(true);
  const [visualizationMode, setVisualizationMode] = useState<'circular' | 'path'>('circular');
  const [engineStatus, setEngineStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [snapshot, setSnapshot] = useState<BreathEngineSnapshot | null>(null);
  const [remainingMs, setRemainingMs] = useState(sessionMinutes * 60 * 1000);
  const [summary, setSummary] = useState<{ durationSec: number } | null>(null);

  useEffect(() => {
    setBreathPreferences({ lastPresetId: presetId });
  }, [presetId, setBreathPreferences]);

  useEffect(() => {
    setBreathPreferences({ lastDuration: sessionMinutes });
  }, [sessionMinutes, setBreathPreferences]);

  useEffect(() => {
    setBreathPreferences({ hapticsEnabled });
  }, [hapticsEnabled, setBreathPreferences]);

  const activePreset: BreathPreset = useMemo(() => getPresetById(presetId) ?? BREATH_PRESETS[0], [presetId]);

  const progress = useSharedValue(0);
  const ringScale = useSharedValue(0.92);
  const ringOpacity = useSharedValue(1);
  const engineRef = useRef<BreathEngine | null>(null);

  const ringAnimatedProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * RING_RADIUS;
    const clamped = Math.min(Math.max(progress.value, 0), 1);
    return {
      strokeDashoffset: circumference * (1 - clamped),
    };
  });

  const outerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const sessionLengthMs = sessionMinutes * 60 * 1000;

  const ensureEngine = useCallback(() => {
    engineRef.current?.stop();
    const engine = new BreathEngine(
      { phases: activePreset.phases, sessionLengthMs, tickIntervalMs: 120 },
      {
        onTick: payload => {
          setSnapshot(payload);
          setRemainingMs(payload.remainingMs);
          const ratio = payload.totalElapsedMs / sessionLengthMs;
          progress.value = withTiming(Math.min(Math.max(ratio, 0), 1), { duration: 120 });
        },
        onPhaseChange: payload => {
          if (hapticsEnabled) {
            haptics.trigger(payload.phase.type === 'exhale' ? 'medium' : 'light');
          }
          if (audioCuesEnabled) {
            breathAudioCueService.playPhaseCue(payload.phase.type as BreathPhaseType);
          }
          const targetScale = payload.phase.type === 'inhale' ? 1.05 : payload.phase.type === 'exhale' ? 0.9 : 0.96;
          ringScale.value = withTiming(targetScale, { duration: Math.min(payload.phase.durationMs, 800), easing: Easing.out(Easing.quad) });
          ringOpacity.value = withTiming(1, { duration: 300 });
        },
        onCompleted: () => {
          setEngineStatus('completed');
          const durationSec = Math.round(sessionLengthMs / 1000);
          logSession({ kind: 'breath', presetId: activePreset.id, durationSec });
          setSummary({ durationSec });
        },
        onStopped: () => {
          setEngineStatus('idle');
        },
      }
    );
    engineRef.current = engine;
    return engine;
  }, [activePreset.id, activePreset.phases, haptics, hapticsEnabled, logSession, progress, ringOpacity, ringScale, sessionLengthMs]);

  useEffect(() => () => {
    engineRef.current?.stop();
    breathAudioCueService.stop();
  }, []);

  const resetVisualState = useCallback(
    (targetProgress: SharedValue<number>, targetScale: SharedValue<number>, targetOpacity: SharedValue<number>) => {
      targetProgress.value = 0;
      targetScale.value = withTiming(0.92, { duration: 240 });
      targetOpacity.value = withTiming(1, { duration: 240 });
    },
    []
  );

  const handleStart = () => {
    const engine = ensureEngine();
    setSummary(null);
    resetVisualState(progress, ringScale, ringOpacity);
    setEngineStatus('running');
    setRemainingMs(sessionLengthMs);
    engine.start();
  };

  const handlePauseOrResume = () => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    if (engineStatus === 'running') {
      engine.pause();
      setEngineStatus('paused');
      return;
    }
    if (engineStatus === 'paused') {
      engine.resume();
      setEngineStatus('running');
    }
  };

  const handleStop = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    breathAudioCueService.reset();
    setEngineStatus('idle');
    setSnapshot(null);
    setRemainingMs(sessionLengthMs);
    resetVisualState(progress, ringScale, ringOpacity);
  };

  const changePreset = (direction: 1 | -1) => {
    const index = BREATH_PRESETS.findIndex(item => item.id === presetId);
    const nextIndex = (index + direction + BREATH_PRESETS.length) % BREATH_PRESETS.length;
    if (engineStatus !== 'idle') {
      handleStop();
    }
    setPresetId(BREATH_PRESETS[nextIndex].id);
  };

  const formattedTime = formatTime(remainingMs);
  const activePhaseLabel = snapshot?.phase.label ?? 'Breathe';
  
  // Map breath phase types to triangle animation phases
  const currentPhaseType: BreathPhaseType = snapshot?.phase.type === 'hold_after_inhale' || snapshot?.phase.type === 'hold_after_exhale' 
    ? 'hold' 
    : (snapshot?.phase.type ?? 'inhale') as BreathPhaseType;
  
  // Calculate cumulative progress through the breath cycle (0-1)
  const cycleProgress = snapshot ? (() => {
    const cycleDuration = activePreset.phases.reduce((sum, p) => sum + p.durationMs, 0);
    const cycleElapsed = snapshot.loop * cycleDuration + 
      activePreset.phases.slice(0, snapshot.phaseIndex).reduce((sum, p) => sum + p.durationMs, 0) +
      snapshot.phaseElapsedMs;
    return (cycleElapsed % cycleDuration) / cycleDuration;
  })() : 0;

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
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{activePreset.name}</Text>
              <Text style={styles.headerSubtitle}>{formattedTime}</Text>
            </View>
            <TouchableOpacity
              onPress={engineStatus === 'running' ? handleStop : () => navigation.goBack()}
              style={styles.iconButton}
              accessibilityRole="button"
            >
              <Text style={styles.iconLabel}>{engineStatus === 'running' ? '✕' : '✓'}</Text>
            </TouchableOpacity>
          </View>

          <WatercolorCard style={styles.ringCard} backgroundColor="#fffaf0" padding={SPACING.space_3}>
            {visualizationMode === 'circular' ? (
              <View style={styles.ringContainer}>
                <Animated.View style={[styles.outerRing, outerAnimatedStyle]}>
                  <Svg width={RING_SIZE} height={RING_SIZE}>
                    <Circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      stroke="rgba(15, 23, 42, 0.12)"
                      strokeWidth={12}
                      fill="none"
                    />
                    <AnimatedCircle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      stroke="#fb7185"
                      strokeWidth={12}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      strokeDasharray={2 * Math.PI * RING_RADIUS}
                      animatedProps={ringAnimatedProps}
                    />
                  </Svg>
                  <View style={styles.ringInnerContent}>
                    <Text style={styles.phaseLabel}>{activePhaseLabel}</Text>
                    <Text style={styles.timerText}>{formattedTime}</Text>
                    <Text style={styles.sessionLabel}>Session {sessionMinutes} min</Text>
                  </View>
                </Animated.View>
              </View>
            ) : (
              <View style={styles.pathContainer}>
                <TriangleBreathPath
                  cycleProgress={cycleProgress}
                  currentPhase={currentPhaseType}
                  phases={activePreset.phases}
                />
                <View style={styles.pathTimerContainer}>
                  <Text style={styles.timerText}>{formattedTime}</Text>
                  <Text style={styles.sessionLabel}>Session {sessionMinutes} min</Text>
                </View>
              </View>
            )}

            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.arrowBubble} onPress={() => changePreset(-1)} accessibilityRole="button">
                <Text style={styles.arrowLabel}>⟵</Text>
              </TouchableOpacity>
              <Pressable
                style={[styles.primaryControl, engineStatus !== 'running' && engineStatus !== 'paused' && styles.primaryControlIdle]}
                onPress={engineStatus === 'running' || engineStatus === 'paused' ? handlePauseOrResume : handleStart}
                accessibilityRole="button"
              >
                <Text style={styles.primaryControlText}>
                  {engineStatus === 'running' ? 'Pause' : engineStatus === 'paused' ? 'Resume' : 'Start'}
                </Text>
              </Pressable>
              <TouchableOpacity style={styles.arrowBubble} onPress={() => changePreset(1)} accessibilityRole="button">
                <Text style={styles.arrowLabel}>⟶</Text>
              </TouchableOpacity>
            </View>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Technique</Text>
            <Text style={styles.sectionCopy}>{activePreset.description}</Text>
          </WatercolorCard>

          <WatercolorCard style={styles.sectionCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.chipRow}>
              {SESSION_LENGTHS.map(length => {
                const isActive = length === sessionMinutes;
                return (
                  <TouchableOpacity
                    key={length}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => {
                      if (engineStatus !== 'idle') {
                        handleStop();
                      }
                      setSessionMinutes(length);
                      setRemainingMs(length * 60 * 1000);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{length} min</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </WatercolorCard>

          <WatercolorCard style={styles.toggleCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Visualization</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.togglePill, visualizationMode === 'circular' && styles.togglePillActive]}
                onPress={() => setVisualizationMode('circular')}
                accessibilityRole="button"
                accessibilityState={{ selected: visualizationMode === 'circular' }}
              >
                <Text style={[styles.toggleText, visualizationMode === 'circular' && styles.toggleTextActive]}>Circular</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.togglePill, visualizationMode === 'path' && styles.togglePillActive]}
                onPress={() => setVisualizationMode('path')}
                accessibilityRole="button"
                accessibilityState={{ selected: visualizationMode === 'path' }}
              >
                <Text style={[styles.toggleText, visualizationMode === 'path' && styles.toggleTextActive]}>Path</Text>
              </TouchableOpacity>
            </View>
          </WatercolorCard>

          <WatercolorCard style={styles.toggleCard} backgroundColor="#fff">
            <Text style={styles.sectionTitle}>Guides</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.togglePill, hapticsEnabled && styles.togglePillActive]}
                onPress={() => setHapticsEnabled(prev => !prev)}
                accessibilityRole="button"
                accessibilityState={{ selected: hapticsEnabled }}
              >
                <Text style={[styles.toggleText, hapticsEnabled && styles.toggleTextActive]}>Haptics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.togglePill, audioCuesEnabled && styles.togglePillActive]}
                onPress={() => setAudioCuesEnabled(prev => !prev)}
                accessibilityRole="button"
                accessibilityState={{ selected: audioCuesEnabled }}
              >
                <Text style={[styles.toggleText, audioCuesEnabled && styles.toggleTextActive]}>Audio cues</Text>
              </TouchableOpacity>
            </View>
          </WatercolorCard>

          {summary ? (
            <WatercolorCard style={styles.summaryCard} backgroundColor="#fff0f3">
              <Text style={styles.summaryTitle}>Session complete</Text>
              <Text style={styles.summarySubtitle}>Logged {Math.round(summary.durationSec / 60)} min</Text>
              <WatercolorButton color="red" onPress={handleStart}>
                <Text style={styles.summaryButtonLabel}>Start again</Text>
              </WatercolorButton>
            </WatercolorCard>
          ) : null}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
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
    gap: SPACING.space_4,
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
    fontSize: 20,
    color: '#1f2937',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  headerSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
  },
  ringCard: {
    gap: SPACING.space_3,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  phaseLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
  },
  timerText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 36,
    color: '#0f172a',
  },
  sessionLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBubble: {
    width: 56,
    height: 56,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  primaryControl: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.space_3,
    borderRadius: 24,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    backgroundColor: '#fde047',
  },
  primaryControlIdle: {
    backgroundColor: '#bbf7d0',
  },
  primaryControlText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  sectionCard: {
    gap: SPACING.space_2,
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  sectionCopy: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  chip: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#bfdbfe',
  },
  chipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  chipTextActive: {
    color: '#1f2937',
  },
  toggleCard: {
    gap: SPACING.space_2,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  togglePill: {
    flex: 1,
    paddingVertical: SPACING.space_2,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  togglePillActive: {
    backgroundColor: '#d9f99d',
  },
  pathContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_4,
  },
  pathTimerContainer: {
    marginTop: SPACING.space_4,
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  toggleTextActive: {
    color: '#1f2937',
  },
  summaryCard: {
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  summaryTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  summarySubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
  },
  summaryButtonLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
