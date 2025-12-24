import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import { useXP } from '@/hooks/useXP';
import { constellationServiceDB } from '@/services/constellationService.database';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

export default function CheckInScreen({ navigation }: Props) {
  const { height, width } = useWindowDimensions();
  const isCompact = height < 720;
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { awardDailyCheckinXP } = useXP();

  const stars = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        left: Math.random() * width,
        top: Math.random() * height,
        opacity: Math.random() * 0.4 + 0.2,
        size: Math.random() * 2 + 2,
      })),
    [height, width]
  );

  const loadStreak = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setStreak(prev => (prev === 0 ? 5 : prev));
      return;
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (!user) {
        setStreak(prev => (prev === 0 ? 5 : prev));
        return;
      }

      setUserId(user.id);
      const skyState = await constellationServiceDB.getSkyState(user.id);
      setStreak(skyState.currentStreak || 0);
    } catch (error) {
      console.warn('[CheckIn] Failed to load streak', error);
      setStreak(prev => (prev === 0 ? 5 : prev));
    }
  }, []);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const handleCheckIn = useCallback(async () => {
    if (hasCheckedIn || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      try {
        await awardDailyCheckinXP();
      } catch (error) {
        console.warn('[CheckIn] Failed to award daily XP', error);
      }

      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setHasCheckedIn(true);

      if (userId) {
        try {
          await constellationServiceDB.updateStreak(userId, nextStreak);
        } catch (error) {
          console.warn('[CheckIn] Failed to update streak in Supabase', error);
        }
      }

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  }, [awardDailyCheckinXP, hasCheckedIn, navigation, streak, submitting, userId]);

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <View style={styles.stars}>
        {stars.map(star => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.left,
                top: star.top,
                opacity: star.opacity,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <View style={[styles.centerContent, isCompact && styles.centerContentCompact]}>
          {!hasCheckedIn ? (
            <>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>✓</Text>
              </View>

              <Text style={styles.title}>Daily Check-In</Text>
              <Text style={styles.subtitle}>Stay consistent, build your creator streak</Text>

              <View style={styles.streakCard}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakNumber}>{streak} days</Text>
                <View style={styles.fireIcon}>
                  <Text style={styles.fireEmoji}>🔥</Text>
                </View>
              </View>

              <PrimaryButton title="Check In Now" onPress={handleCheckIn} />

              <Text style={styles.disclaimer}>
                Check in daily to maintain your streak and track your progress
              </Text>
            </>
          ) : (
            <>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>🎉</Text>
              </View>

              <Text style={styles.successTitle}>Check-In Complete!</Text>
              <Text style={styles.successSubtitle}>Keep building, keep creating!</Text>

              <View style={styles.newStreakCard}>
                <Text style={styles.newStreakNumber}>{streak}</Text>
                <Text style={styles.newStreakLabel}>Day Streak</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_5,
    paddingBottom: SPACING.space_6,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  centerContentCompact: {
    justifyContent: 'flex-start',
    paddingTop: SPACING.space_5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 3,
    borderColor: COLORS.ACCENT_GRADIENT_START,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  icon: {
    fontSize: 48,
    color: COLORS.ACCENT_GRADIENT_START,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 20,
    padding: SPACING.space_5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    marginBottom: SPACING.space_2,
    width: '100%',
    gap: SPACING.space_2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  streakLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  fireIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  fireEmoji: {
    fontSize: 22,
  },
  disclaimer: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: SPACING.space_2,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.ACCENT_GRADIENT_END,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  successSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  newStreakCard: {
    alignItems: 'center',
    gap: SPACING.space_1,
    padding: SPACING.space_4,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  newStreakNumber: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  newStreakLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
});
