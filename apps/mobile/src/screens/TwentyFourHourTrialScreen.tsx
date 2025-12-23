import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { RADII } from '@/core/theme/radii';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'TwentyFourHourTrial'>;

const PLAN_CHOICES = [
  {
    id: 'monthly' as const,
    label: 'Monthly',
    price: '$11.11/mo',
    copy: 'Cancel anytime. Full access while subscribed.',
  },
  {
    id: 'yearly' as const,
    label: 'Yearly',
    price: '$6.48/mo',
    copy: '$77.77 billed annually. Best deal + 3 days free.',
    badge: '3 DAYS FREE',
  },
];

const TIMELINE = [
  {
    icon: '🔓',
    title: 'Today',
    detail: 'Instant access to blockers, rituals, and the builder community.',
  },
  {
    icon: '🔔',
    title: 'In 2 Days',
    detail: 'We send a heads-up before billing ever starts.',
  },
  {
    icon: '💳',
    title: 'In 3 Days',
    detail: 'Trial converts. Cancel anytime before then—no questions.',
  },
];

export default function TwentyFourHourTrialScreen({ navigation }: Props) {
  const { setOnboardingCompleted } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleStartTrial = () => {
    // Mark onboarding as completed
    setOnboardingCompleted(true);
    // Start 24-hour trial, navigate to Home
    navigation.navigate('Home');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚡️</Text>
        </View>

        <Text style={styles.title}>Start your 3-day FREE trial to continue.</Text>
        <Text style={styles.subtitle}>We’ll remind you before anything charges. Pick the plan that fits.</Text>

        <View style={styles.timelineContainer}>
          {TIMELINE.map(item => (
            <View key={item.title} style={styles.timelineRow}>
              <View style={styles.timelineIconBubble}>
                <Text style={styles.timelineIcon}>{item.icon}</Text>
              </View>
              <View style={styles.timelineTextBlock}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.planSelector}>
          <Text style={styles.planSelectorTitle}>Choose your plan</Text>
          <Text style={styles.planSelectorSubtitle}>No payment due now. Cancel anytime during the trial.</Text>
          <View style={styles.planRow}>
            {PLAN_CHOICES.map(plan => {
              const isSelected = plan.id === selectedPlan;
              return (
                <Pressable
                  key={plan.id}
                  style={[styles.planOption, isSelected && styles.planOptionSelected]}
                  onPress={() => setSelectedPlan(plan.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    {plan.badge ? (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planCopy}>{plan.copy}</Text>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    <View style={[styles.radioInner, isSelected && styles.radioInnerSelected]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.urgencyCard}>
          <Text style={styles.urgencyTitle}>What happens after the trial?</Text>
          <Text style={styles.urgencyText}>Stick with Unscroller for $11.11/mo or $6.48/mo billed annually ($77.77).</Text>
        </View>

        <Text style={styles.disclaimer}>3 days free, then keep your plan. Cancel anytime before the trial ends.</Text>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <Text style={styles.noPaymentText}>No payment due now</Text>
        <PrimaryButton title="Start My 3-Day Free Trial" onPress={handleStartTrial} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0118',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.space_5,
    gap: SPACING.space_4,
    paddingBottom: SPACING.space_7,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: SPACING.space_2,
    marginBottom: SPACING.space_2,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.space_2,
    lineHeight: 38,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.space_5,
    lineHeight: 24,
  },
  timelineContainer: {
    gap: SPACING.space_3,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'flex-start',
  },
  timelineIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIcon: {
    fontSize: 22,
  },
  timelineTextBlock: {
    flex: 1,
  },
  timelineTitle: {
    ...TYPOGRAPHY.H4,
    color: COLORS.TEXT_PRIMARY,
  },
  timelineDetail: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginTop: 2,
  },
  planSelector: {
    gap: SPACING.space_2,
    marginTop: SPACING.space_3,
  },
  planSelectorTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  planSelectorSubtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  planRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    marginTop: SPACING.space_2,
  },
  planOption: {
    flex: 1,
    borderRadius: RADII.radius_card,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_3,
    gap: SPACING.space_1,
    position: 'relative',
  },
  planOptionSelected: {
    borderColor: COLORS.ACCENT_GRADIENT_START,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabel: {
    ...TYPOGRAPHY.Body,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  planBadge: {
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1 / 1.5,
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
  },
  planBadgeText: {
    ...TYPOGRAPHY.Subtext,
    color: '#065F46',
    letterSpacing: 1,
  },
  planPrice: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  planCopy: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  radioOuter: {
    position: 'absolute',
    top: SPACING.space_3,
    right: SPACING.space_3,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.ACCENT_GRADIENT_START,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioInnerSelected: {
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  urgencyCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 16,
    padding: SPACING.space_4,
    marginBottom: SPACING.space_4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  urgencyTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_2,
  },
  urgencyText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  disclaimer: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.space_2,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_5,
    paddingTop: SPACING.space_2,
    gap: SPACING.space_2,
    alignItems: 'center',
  },
  noPaymentText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
});
