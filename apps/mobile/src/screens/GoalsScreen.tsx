import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Goals'>;

const GOALS = [
  { id: 1, title: 'Ship 3 Projects', progress: 1, total: 3, icon: '🚀', active: true },
  { id: 2, title: '90-Day Streak', progress: 45, total: 90, icon: '🔥', active: true },
  { id: 3, title: 'Gain 1K Followers', progress: 350, total: 1000, icon: '👥', active: true },
];

export default function GoalsScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  return (
    <ScreenWrapper contentStyle={[styles.safeArea, isCompact && styles.safeAreaCompact]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      
      <View style={styles.stars}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View key={i} style={[styles.star, { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.35 + 0.35 }]} />
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.glassIcon} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goals</Text>
          <TouchableOpacity style={styles.glassIcon} activeOpacity={0.85}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🎯</Text>
          <Text style={styles.heroTitle}>Build Your Future</Text>
          <Text style={styles.heroSubtitle}>Set goals and track your transformation</Text>
        </View>

        <View style={styles.goalsList}>
          {GOALS.map(goal => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(goal.progress / goal.total) * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{goal.progress} / {goal.total}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Set SMART Goals</Text>
          <Text style={styles.tipText}>
            Specific, Measurable, Achievable, Relevant, Time-bound
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: SPACING.space_5,
    paddingBottom: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  safeAreaCompact: {
    paddingTop: SPACING.space_4,
  },
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_4,
    gap: SPACING.space_3,
  },
  glassIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  addIcon: {
    fontSize: 22,
    color: COLORS.TEXT_PRIMARY,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_3,
  },
  heroIcon: {
    fontSize: 48,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  goalsList: {
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_4,
    marginBottom: SPACING.space_6,
  },
  goalCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    gap: SPACING.space_4,
  },
  goalIcon: {
    fontSize: 32,
  },
  goalInfo: {
    flex: 1,
    gap: SPACING.space_3,
  },
  goalTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ACCENT_GRADIENT_START,
  },
  tipCard: {
    marginHorizontal: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: SPACING.space_2,
  },
  tipTitle: {
    ...TYPOGRAPHY.Body,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  tipText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
