import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

const METRICS = [
  { id: 1, label: 'Days Focused', value: '21', change: '+12' },
  { id: 2, label: 'Time Reclaimed', value: '14h', change: '+6h' },
  { id: 3, label: 'Challenges Completed', value: '8', change: '+3' },
];

export default function ProgressTrackingScreen({ navigation }: Props) {
  const bars = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        height: 30 + Math.random() * 80,
      })),
    []
  );

  const handleContinue = () => {
    navigation.navigate('Progress');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Analytics Preview</Text>
        </View>

        <Text style={styles.title}>See your wins, every day.</Text>
        <Text style={styles.subtitle}>
          We’ll track your focus, reclaimed time, and challenge streaks so you stay motivated.
        </Text>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>7-day Focus Streak</Text>
          <View style={styles.chartBars}>
            {bars.map(bar => (
              <View key={bar.id} style={[styles.chartBar, { height: bar.height }]} />
            ))}
          </View>
          <Text style={styles.chartCaption}>Keep up the momentum to unlock new streak badges.</Text>
        </View>

        <View style={styles.metricsRow}>
          {METRICS.map(metric => (
            <View key={metric.id} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricChange}>{metric.change} this week</Text>
            </View>
          ))}
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.pricingBadge}>
            <Text style={styles.pricingBadgeText}>Lowest price</Text>
          </View>
          <Text style={styles.pricingTitle}>Keep tracking your wins</Text>
          <Text style={styles.pricingSubtitle}>Annual plan · Just $6.48/mo billed yearly</Text>
          <Text style={styles.pricingFootnote}>Cancel anytime • Keep your progress synced</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="Continue" onPress={handleContinue} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    paddingBottom: SPACING.space_7,
    gap: SPACING.space_4,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 14,
  },
  badgeText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.BACKGROUND_ELEVATED,
    fontFamily: 'Inter-SemiBold',
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 42,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  chartCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    gap: SPACING.space_3,
  },
  chartTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.space_2,
  },
  chartBar: {
    flex: 1,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 6,
    minHeight: 24,
  },
  chartCaption: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    flexWrap: 'wrap',
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 14,
    padding: SPACING.space_3,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.space_1,
  },
  metricValue: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  metricChange: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.ACCENT_GRADIENT_START,
    marginTop: SPACING.space_1,
  },
  pricingCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    gap: SPACING.space_2,
  },
  pricingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 12,
  },
  pricingBadgeText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.BACKGROUND_ELEVATED,
    fontFamily: 'Inter-SemiBold',
  },
  pricingTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  pricingSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  pricingFootnote: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    borderTopWidth: 1,
    borderTopColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
});
