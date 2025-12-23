import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  useBlockingStore,
  selectUsageSummary,
  selectUsageFetchedAt,
  selectBlockingCapability,
} from '@/features/blocking/blockingStore';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type Props = NativeStackScreenProps<RootStackParamList, 'ScreenTimeDashboard'>;

export default function ScreenTimeDashboardScreen(_: Props) {
  const navigation = useNavigation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const usageSummary = useBlockingStore(selectUsageSummary);
  const lastFetchedAt = useBlockingStore(selectUsageFetchedAt);
  const capability = useBlockingStore(selectBlockingCapability);
  const refreshUsageSummary = useBlockingStore(state => state.refreshUsageSummary);

  const fetchSummary = useCallback(async () => {
    setIsRefreshing(true);
    const now = Date.now();
    const from = now - ONE_DAY_MS;
    try {
      await refreshUsageSummary(from, now);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshUsageSummary]);

  useEffect(() => {
    if (!usageSummary) {
      void fetchSummary();
    }
  }, [fetchSummary, usageSummary]);

  useFocusEffect(
    useCallback(() => {
      if (!usageSummary) {
        void fetchSummary();
      }
    }, [fetchSummary, usageSummary])
  );

  const totalMinutes = useMemo(() => {
    if (!usageSummary) {
      return 0;
    }
    return Math.round((usageSummary.totalForegroundMs ?? 0) / 60000);
  }, [usageSummary]);

  const perApp = usageSummary?.perApp ?? [];

  return (
    <ScreenWrapper contentStyle={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.85}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screen Time</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Last 24 hours</Text>
          <Text style={styles.summaryValue}>{totalMinutes} min</Text>
          <Text style={styles.summaryHint}>
            {capability.authorized
              ? 'Detailed reports will populate as native enforcement comes online.'
              : 'Authorize screen-time access to unlock full telemetry.'}
          </Text>
          {lastFetchedAt ? (
            <Text style={styles.summaryMeta}>Updated {new Date(lastFetchedAt).toLocaleTimeString()}</Text>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top apps</Text>
          <TouchableOpacity onPress={fetchSummary} style={styles.refreshButton} activeOpacity={0.85}>
            {isRefreshing ? <ActivityIndicator color={COLORS.ACCENT_GRADIENT_START} size="small" /> : <Text style={styles.refreshText}>Refresh</Text>}
          </TouchableOpacity>
        </View>

        {perApp.length === 0 ? (
          <Text style={styles.emptyState}>Usage data will appear here once the native collectors are wired up.</Text>
        ) : (
          perApp.map(item => {
            const minutes = Math.round((item.foregroundMs ?? 0) / 60000);
            return (
              <View key={item.appId} style={styles.appRow}>
                <Text style={styles.appName}>{item.appId}</Text>
                <Text style={styles.appMinutes}>{minutes} min</Text>
              </View>
            );
          })
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_5,
    paddingVertical: SPACING.space_4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND_MAIN,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_4,
  },
  summaryCard: {
    borderRadius: 20,
    padding: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.ACCENT_GRADIENT_START,
    marginVertical: SPACING.space_2,
  },
  summaryHint: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryMeta: {
    marginTop: SPACING.space_2,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  refreshButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_GRADIENT_START,
    backgroundColor: 'rgba(77,161,255,0.08)',
  },
  refreshText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: '600',
  },
  emptyState: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.space_3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.GLASS_BORDER,
  },
  appName: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  appMinutes: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
});
