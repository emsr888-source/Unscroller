import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SPACING } from '@/core/theme/spacing';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  useBlockingStore,
  selectBlockSets,
  selectActiveTask,
  selectBlockingCapability,
  defaultBlockSet,
  DEFAULT_BLOCK_SET_ID,
} from '@/features/blocking/blockingStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

const DEFAULT_DURATION_MIN = 25;

const formatRemaining = (remainingMs: number | undefined, startedAt: number | null, durationMin: number, now: number) => {
  const endTimestamp = startedAt ? startedAt + durationMin * 60 * 1000 : null;
  const remaining = remainingMs ?? (endTimestamp ? Math.max(endTimestamp - now, 0) : durationMin * 60 * 1000);
  const minutes = Math.floor(remaining / 60000)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor((remaining % 60000) / 1000)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

type Props = NativeStackScreenProps<RootStackParamList, 'TaskTimer'>;

export default function TaskTimerScreen({ navigation, route }: Props) {
  const { taskId, title, durationMin: routeDurationMin, blockSetId: routeBlockSetId } = route.params;
  const [initTimestamp] = useState(() => Date.now());
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const activeTask = useBlockingStore(selectActiveTask);
  const blockSets = useBlockingStore(selectBlockSets);
  const capability = useBlockingStore(selectBlockingCapability);
  const startTask = useBlockingStore(state => state.startTask);
  const stopTask = useBlockingStore(state => state.stopTask);
  const authorize = useBlockingStore(state => state.authorize);
  const durationMin = activeTask?.task.durationMin ?? routeDurationMin ?? DEFAULT_DURATION_MIN;
  const activeBlockSetId = activeTask?.task.blockSetId ?? routeBlockSetId ?? DEFAULT_BLOCK_SET_ID;
  const resolvedBlockSet = useMemo(
    () => blockSets.find(set => set.id === activeBlockSetId) ?? defaultBlockSet,
    [blockSets, activeBlockSetId]
  );

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTask?.task.id === taskId) {
      return;
    }

    const taskPayload = {
      id: taskId,
      title,
      durationMin,
      blockSetId: resolvedBlockSet.id,
      startsAt: initTimestamp,
    };

    startTask(taskPayload).catch(error => {
      console.warn('[TaskTimer] Failed to start task', error);
    });

    return () => {
      stopTask(taskId).catch(error => {
        console.warn('[TaskTimer] Failed to stop task', error);
      });
    };
  }, [activeTask?.task.id, durationMin, initTimestamp, resolvedBlockSet.id, startTask, stopTask, taskId, title]);

  const remainingLabel = formatRemaining(activeTask?.remainingMs, activeTask?.startedAt ?? initTimestamp, durationMin, currentTime);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <WatercolorCard style={styles.card}>
            <Text style={styles.emoji}>{resolvedBlockSet.blockedEmoji ?? '🚫'}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.timer}>{remainingLabel}</Text>
            <Text style={styles.blockSetLabel}>Block set: {resolvedBlockSet.name}</Text>
            <Text style={styles.subtext}>
              {capability.authorized
                ? resolvedBlockSet.blockedMessage ?? 'Stay locked in. Blocker running for linked apps.'
                : 'Authorize screen-time controls to enable app blocking.'}
            </Text>

            {!capability.authorized ? (
              <WatercolorButton
                color="neutral"
                onPress={() => {
                  authorize().catch(error => {
                    console.warn('[TaskTimer] authorize failed', error);
                  });
                }}
                style={styles.authButton}
              >
                <Text style={styles.authButtonText}>Grant Screen-Time Access</Text>
              </WatercolorButton>
            ) : null}

            <WatercolorButton
              color="yellow"
              onPress={() => {
                stopTask(taskId).finally(() => navigation.goBack());
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>End Session</Text>
            </WatercolorButton>

            <WatercolorButton color="neutral" onPress={() => navigation.goBack()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Minimize</Text>
            </WatercolorButton>
          </WatercolorCard>
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
  },
  card: {
    alignItems: 'center',
    gap: SPACING.space_3,
    paddingVertical: SPACING.space_5,
    backgroundColor: '#fff',
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
    textAlign: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  subtext: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: SPACING.space_4,
  },
  blockSetLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  authButton: {
    width: '100%',
  },
  authButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  primaryButton: {
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  secondaryButton: {
    width: '100%',
  },
  secondaryButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
});
