import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'WelcomeToJourney'>;

export default function WelcomeToJourneyScreen({ navigation }: Props) {
  const handleContinue = () => {
    navigation.navigate('PlanPreview');
  };

  useEffect(() => {
    const timer = setTimeout(handleContinue, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Welcome</Text>
        </View>

        <Text style={styles.title}>
          Welcome to Unscroller,{'\n'}your path to freedom.
        </Text>

        <Text style={styles.subtitle}>
          We’re setting up your plan. This will just take a moment.
        </Text>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingRing} />
          <View style={styles.loadingDot} />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="Continue" onPress={handleContinue} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_4,
  },
  badge: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 12,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.space_2,
  },
  loadingRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: COLORS.GLASS_BORDER,
    borderTopColor: COLORS.ACCENT_GRADIENT_START,
    borderRightColor: COLORS.ACCENT_GRADIENT_END,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    marginTop: SPACING.space_2,
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
