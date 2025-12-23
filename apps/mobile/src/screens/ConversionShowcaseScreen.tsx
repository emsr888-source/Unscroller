import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';
import { RADII } from '@/core/theme/radii';

type Props = NativeStackScreenProps<RootStackParamList, 'ConversionShowcase'>;

const BENEFITS = [
  { id: 1, icon: '🎯', label: 'Deep Focus', color: '#0077be' },
  { id: 2, icon: '🚀', label: 'Build & Create', color: '#ff6b35' },
  { id: 3, icon: '⏰', label: 'Reclaim Your Time', color: '#00a86b' },
  { id: 4, icon: '💡', label: 'Clear Thinking', color: '#ffa500' },
  { id: 5, icon: '📈', label: 'Real Progress', color: '#9370db' },
  { id: 6, icon: '🎨', label: 'Creative Flow', color: '#ff1493' },
];

const HABITS = [
  {
    id: 1,
    icon: '⏰',
    title: 'Set creation time blocks',
    description: 'Dedicate focused time to building your projects',
  },
  {
    id: 2,
    icon: '🎯',
    title: 'Track your real-life progress',
    description: 'Level up in life, not just on social media',
  },
  {
    id: 3,
    icon: '🚀',
    title: 'Daily creator challenge',
    description: 'Build something every day, no matter how small',
  },
];

export default function ConversionShowcaseScreen({ navigation }: Props) {
  // Calculate quit date (90 days from now)
  const quitDate = new Date();
  quitDate.setDate(quitDate.getDate() + 90);
  const formattedQuitDate = quitDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleBuyBack = () => {
    navigation.navigate('CustomPlan');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={styles.heroBlock}>
          <Text style={styles.eyebrow}>Your custom plan</Text>
          <Text style={styles.title}>Scroll-free by {formattedQuitDate}</Text>
          <Text style={styles.subtitle}>Here’s what unlocking Unscroller gives you — tailored routines, tangible progress, and the guardrails to keep momentum.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100)} style={styles.cardSection}>
          <Text style={styles.sectionHeading}>Your edge</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
              <Animated.View
                key={benefit.id}
                entering={FadeInUp.delay(150 + index * 50)}
                style={styles.benefitCard}
              >
                <View style={[styles.benefitIcon, { backgroundColor: benefit.color }]}>
                  <Text style={styles.benefitIconText}>{benefit.icon}</Text>
                </View>
                <Text style={styles.benefitLabel}>{benefit.label}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220)} style={styles.cardSection}>
          <Text style={styles.sectionHeading}>Daily habits we’ll install</Text>
          <View style={styles.habitsList}>
            {HABITS.map(habit => (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitIcon}>
                  <Text style={styles.habitIconText}>{habit.icon}</Text>
                </View>
                <View style={styles.habitContent}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <Text style={styles.habitDescription}>{habit.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(260)} style={styles.controlCard}>
          <Text style={styles.controlTitle}>Creators already feel the shift</Text>
          <Text style={styles.controlSubtitle}>Thousands use Unscroller to ship more, stay sharp, and reclaim hours each week.</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>2.5hrs</Text>
              <Text style={styles.statLabel}>Avg. daily time saved</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>87%</Text>
              <Text style={styles.statLabel}>Stick with us past 30 days</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <PrimaryButton title="Buy back your time" onPress={handleBuyBack} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_7,
    gap: SPACING.space_5,
  },
  heroBlock: {
    gap: SPACING.space_2,
  },
  eyebrow: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  cardSection: {
    gap: SPACING.space_3,
  },
  sectionHeading: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.space_3,
  },
  benefitCard: {
    width: '47%',
    backgroundColor: COLORS.GLASS_TINT,
    borderRadius: RADII.radius_card,
    padding: SPACING.space_4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_2,
  },
  benefitIconText: {
    fontSize: 24,
  },
  benefitLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  habitsList: {
    gap: SPACING.space_3,
  },
  habitCard: {
    backgroundColor: COLORS.GLASS_TINT,
    borderRadius: RADII.radius_card,
    padding: SPACING.space_4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_3,
  },
  habitIconText: {
    fontSize: 20,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  habitDescription: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  controlCard: {
    backgroundColor: 'rgba(160, 96, 255, 0.15)',
    borderRadius: RADII.radius_card,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  controlTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  controlSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.space_2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.space_4,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.H2,
    color: '#00FFB3',
  },
  statLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  ctaBar: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_7,
    paddingTop: SPACING.space_3,
  },
});
