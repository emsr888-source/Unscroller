import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'SevenDayTrial'>;

const REMINDER_POINTS = [
  'No payment due today—your trial is on us.',
  'We’ll nudge you 24 hours before billing starts.',
  'Cancel anytime from Settings in two taps.',
];

export default function SevenDayTrialScreen({ navigation }: Props) {
  const { setOnboardingCompleted } = useAppStore();

  const handleStartTrial = () => {
    // Mark onboarding as completed
    setOnboardingCompleted(true);
    // Start 7-day trial, navigate to Home
    navigation.navigate('Home');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Free trial reminder</Text>
        </View>

        <Text style={styles.title}>We’ll remind you before your free trial ends</Text>
        <Text style={styles.subtitle}>Stay focused knowing we’ll tap you on the shoulder before billing ever hits.</Text>

        <View style={styles.illustration}>
          <Text style={styles.illustrationIcon}>🔔</Text>
          <View style={styles.notificationDot}>
            <Text style={styles.notificationDotText}>1</Text>
          </View>
        </View>

        <View style={styles.reminderList}>
          {REMINDER_POINTS.map(point => (
            <View key={point} style={styles.reminderRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.reminderText}>{point}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.priceFootnote}>Monthly $11.11 • Yearly $6.48/mo ($77.77 billed annually)</Text>
      </ScrollView>

      {/* CTA Buttons */}
      <View style={styles.bottomContainer}>
        <PrimaryButton title="Continue for FREE" onPress={handleStartTrial} />

        <TouchableOpacity style={styles.declineButton} onPress={() => navigation.navigate('TwentyFourHourTrial')}>
          <Text style={styles.declineButtonText}>Want plan details first?</Text>
          <Text style={styles.declineSubtext}>See the pricing breakdown</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.space_5,
    gap: SPACING.space_4,
    paddingBottom: SPACING.space_6,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  badgeText: {
    ...TYPOGRAPHY.Subtext,
    color: '#4338CA',
    letterSpacing: 1,
  },
  title: {
    ...TYPOGRAPHY.H1,
    textAlign: 'center',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
  },
  illustration: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#EEF2FF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.space_2,
    marginBottom: SPACING.space_2,
  },
  illustrationIcon: {
    fontSize: 48,
  },
  notificationDot: {
    position: 'absolute',
    top: 22,
    right: 28,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDotText: {
    ...TYPOGRAPHY.Body,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  reminderList: {
    gap: SPACING.space_2,
    marginTop: SPACING.space_2,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  checkmark: {
    fontSize: 18,
    color: '#16A34A',
    marginTop: 2,
  },
  reminderText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  priceFootnote: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.space_2,
  },
  bottomContainer: {
    padding: SPACING.space_4,
    gap: SPACING.space_3,
  },
  declineButton: {
    alignItems: 'center',
    gap: SPACING.space_1 / 2,
  },
  declineButtonText: {
    ...TYPOGRAPHY.Body,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  declineSubtext: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.space_1,
  },
});
