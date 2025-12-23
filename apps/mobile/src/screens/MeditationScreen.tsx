import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Meditation'>;

const EXERCISES = [
  { id: 1, title: '5-Minute Focus', description: 'Quick breathing for instant calm', duration: '5 min', icon: '🌬️' },
  { id: 2, title: 'Body Scan', description: 'Release tension head to toe', duration: '10 min', icon: '🧘' },
  { id: 3, title: 'Gratitude Practice', description: 'Reflect on what you\'re building', duration: '7 min', icon: '🙏' },
  { id: 4, title: 'Visualization', description: 'See your future success', duration: '12 min', icon: '✨' },
];

export default function MeditationScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);

  return (
    <ScreenWrapper contentStyle={isCompact ? styles.safeAreaCompact : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      
      <View style={styles.stars}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View key={i} style={[styles.star, { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.3 }]} />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meditation</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🧘</Text>
          <Text style={styles.heroTitle}>Find Your Center</Text>
          <Text style={styles.heroSubtitle}>Guided exercises for focus and clarity</Text>
        </View>

        <View style={styles.exercisesList}>
          {EXERCISES.map(exercise => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseCard,
                selectedExercise === exercise.id && styles.exerciseCardActive,
              ]}
              onPress={() => setSelectedExercise(exercise.id)}
              activeOpacity={0.9}
            >
              <View style={styles.exerciseIcon}>
                <Text style={styles.exerciseIconText}>{exercise.icon}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{exercise.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipTitle}>Pro Tip</Text>
          <Text style={styles.tipText}>
            Best practiced in the morning or when you feel the urge to scroll
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeAreaCompact: {
    // Compact layout adjustments
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
  scrollContent: {
    paddingBottom: SPACING.space_6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_3,
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
    fontSize: 28,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_3,
  },
  heroIcon: {
    fontSize: 64,
  },
  heroTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  exercisesList: {
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_4,
    marginBottom: SPACING.space_6,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  exerciseCardActive: {
    borderColor: 'rgba(77, 161, 255, 0.4)',
    backgroundColor: 'rgba(77, 161, 255, 0.1)',
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(77, 161, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIconText: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
    gap: SPACING.space_1,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  exerciseDescription: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  durationBadge: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 12,
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(77, 161, 255, 0.28)',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ACCENT_GRADIENT_START,
  },
  tipCard: {
    marginHorizontal: SPACING.space_5,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tipIcon: {
    fontSize: 32,
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
