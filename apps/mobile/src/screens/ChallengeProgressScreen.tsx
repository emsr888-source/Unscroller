import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { CommunityChallengeId, getCommunityChallenge } from '@/constants/communityChallenges';
import { challengesServiceDB as challengesService, ChallengeProgress } from '@/services/challengesService.database';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { COLORS } from '@/core/theme/colors';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

const GOAL_TARGETS: Record<CommunityChallengeId, number> = {
  deep_focus: 25,
  habit_reset: 7,
  creator_hour: 20,
};

const METRIC_LABEL: Record<string, string> = {
  feed_free_days: 'feed-free days',
  focus_hours: 'focus hours',
  time_saved: 'minutes saved',
  streak_days: 'streak days',
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeProgress'>;

type ChecklistState = Record<string, boolean>;

type ProgressModel = {
  id: CommunityChallengeId;
  title: string;
  description: string;
  accent: string;
  gradient: readonly [string, string];
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  metricLabel: string;
  joinedAt?: Date | null;
  completedAt?: Date | null;
  dailyActions: string[];
  weeklyWins: string[];
  successMetrics: string[];
};

export default function ChallengeProgressScreen({ navigation, route }: Props) {
  const requestedId = route.params?.challengeId ?? ('deep_focus' as CommunityChallengeId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [model, setModel] = useState<ProgressModel | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [userId, setUserId] = useState<string | null>(null);

  const challengeDefinition = useMemo(() => getCommunityChallenge(requestedId), [requestedId]);

  const applyDemoModel = useCallback(() => {
    if (!challengeDefinition) {
      setModel(null);
      return;
    }

    const target = GOAL_TARGETS[challengeDefinition.id] ?? 10;
    const seedPercent = 45;
    const currentValue = Math.round((seedPercent / 100) * target);

    setModel({
      id: challengeDefinition.id,
      title: challengeDefinition.title,
      description: challengeDefinition.description,
      accent: challengeDefinition.theme.accent,
      gradient: challengeDefinition.theme.gradient as readonly [string, string],
      currentValue,
      targetValue: target,
      percentComplete: seedPercent,
      metricLabel: 'sessions completed',
      joinedAt: null,
      completedAt: null,
      dailyActions: challengeDefinition.dailyActions,
      weeklyWins: challengeDefinition.weeklyWins,
      successMetrics: challengeDefinition.successMetrics,
    });
    setChecklist({});
    setDemoMode(true);
    setLoading(false);
  }, [challengeDefinition]);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!challengeDefinition) {
      setError('Challenge not found.');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      applyDemoModel();
      return;
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user?.id) {
        applyDemoModel();
        return;
      }

      setUserId(user.id);
      setDemoMode(false);

      const serverProgress: ChallengeProgress | null = await challengesService.getChallengeProgress(
        user.id,
        challengeDefinition.id,
      );

      if (!serverProgress) {
        applyDemoModel();
        return;
      }

      const metricKey = serverProgress.challenge.goal.metric;
      const metricLabel = METRIC_LABEL[metricKey] || 'progress';
      const target = serverProgress.challenge.goal.target || GOAL_TARGETS[challengeDefinition.id] || 10;

      setModel({
        id: challengeDefinition.id,
        title: serverProgress.challenge.title,
        description: serverProgress.challenge.description,
        accent: challengeDefinition.theme.accent,
        gradient: challengeDefinition.theme.gradient as readonly [string, string],
        currentValue: serverProgress.currentProgress,
        targetValue: target,
        percentComplete: serverProgress.percentComplete,
        metricLabel,
        joinedAt: serverProgress.joinedAt,
        completedAt: serverProgress.completedAt,
        dailyActions: challengeDefinition.dailyActions,
        weeklyWins: challengeDefinition.weeklyWins,
        successMetrics: challengeDefinition.successMetrics,
      });
      setChecklist({});
    } catch (progressError) {
      console.error('[ChallengeProgress] load failed', progressError);
      setError(progressError instanceof Error ? progressError.message : 'Failed to load progress.');
      applyDemoModel();
    } finally {
      setLoading(false);
    }
  }, [applyDemoModel, challengeDefinition]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleToggleChecklist = (item: string) => {
    setChecklist(prev => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleLogProgress = async () => {
    if (!model) return;
    const nextValue = Math.min(model.targetValue, model.currentValue + 1);
    const nextPercent = Math.min(100, (nextValue / model.targetValue) * 100);

    setModel(prev =>
      prev
        ? {
            ...prev,
            currentValue: nextValue,
            percentComplete: nextPercent,
          }
        : prev,
    );

    if (!demoMode && userId) {
      try {
        await challengesService.updateChallengeProgress(userId, model.id, nextValue);
      } catch (updateError) {
        console.warn('[ChallengeProgress] update failed', updateError);
        setError('Unable to sync progress right now.');
      }
    }
  };

  if (loading || !model) {
    return (
      <ScreenWrapper contentStyle={styles.centered}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
        <ActivityIndicator color={COLORS.ACCENT_GRADIENT_START} size="large" />
        <Text style={styles.loadingText}>Loading challenge tracker…</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{model.title}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <Text style={styles.description}>{model.description}</Text>

        {demoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Preview mode – sign in to track real progress.</Text>
          </View>
        )}

        {error && !demoMode && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall progress</Text>
            <Text style={[styles.progressPercent, { color: model.accent }]}>{Math.round(model.percentComplete)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${model.percentComplete}%`, backgroundColor: model.accent }]} />
          </View>
          <Text style={styles.progressMeta}>
            {model.currentValue}/{model.targetValue} {model.metricLabel}
          </Text>

          <PrimaryButton title="Log today’s win" onPress={handleLogProgress} style={styles.logButton} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily actions</Text>
          {model.dailyActions.map(item => (
            <ChecklistRow
              key={item}
              label={item}
              checked={Boolean(checklist[item])}
              accent={model.accent}
              onToggle={() => handleToggleChecklist(item)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly wins</Text>
          {model.weeklyWins.map(item => (
            <ChecklistRow
              key={item}
              label={item}
              checked={Boolean(checklist[item])}
              accent={model.accent}
              onToggle={() => handleToggleChecklist(item)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Success metrics</Text>
          {model.successMetrics.map(item => (
            <ChecklistRow
              key={item}
              label={item}
              checked={Boolean(checklist[item])}
              accent={model.accent}
              onToggle={() => handleToggleChecklist(item)}
            />
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function ChecklistRow({
  label,
  checked,
  onToggle,
  accent,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  accent: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.checkRow,
        checked && [styles.checkRowChecked, { borderColor: accent, backgroundColor: 'rgba(77, 161, 255, 0.12)' }],
      ]}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={[styles.checkCircle, checked && { borderColor: accent, backgroundColor: COLORS.BACKGROUND_ELEVATED }]}>
        {checked && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_5,
    gap: SPACING.space_4,
  },
  loadingText: {
    marginTop: SPACING.space_3,
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backIcon: {
    fontSize: 26,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  description: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  demoBanner: {
    backgroundColor: 'rgba(255, 189, 76, 0.18)',
    borderColor: 'rgba(255, 189, 76, 0.35)',
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.space_3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  demoBannerText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(252, 165, 165, 0.16)',
    borderColor: 'rgba(252, 165, 165, 0.35)',
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.space_3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  errorText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 20,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 0.4,
  },
  progressPercent: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  progressBar: {
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 30, 40, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressMeta: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  logButton: {
    marginTop: SPACING.space_2,
  },
  section: {
    gap: SPACING.space_3,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    paddingVertical: SPACING.space_3,
    paddingHorizontal: SPACING.space_3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
  },
  checkRowChecked: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
  },
  checkLabel: {
    flex: 1,
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  checkLabelChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.TEXT_SECONDARY,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
