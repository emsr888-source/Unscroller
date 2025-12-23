import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'FreeTrialInvite'>;

export default function FreeTrialInviteScreen({ navigation }: Props) {
  const handleTryNow = () => {
    navigation.navigate('NotificationPermission');
  };

  const handleRestore = () => {
    navigation.navigate('NotificationPermission');
  };

  return (
    <ScreenWrapper edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <View style={styles.page}>
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} hitSlop={HIT_SLOP}>
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.headline}>We want you to try Unscroller for free.</Text>
        </View>

        <View style={styles.blankStage} accessibilityRole="image" />

        <View style={styles.bottomPanel}>
          <Text style={styles.noPayment}>✓ No payment due now</Text>
          <PrimaryButton title="Try for $0.00" onPress={handleTryNow} />
          <Text style={styles.pricingFootnote}>Just $77.77/year (≈ $6.48/mo) or $11.11 billed monthly.</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_5,
  },
  restoreButton: {
    alignSelf: 'flex-end',
    padding: SPACING.space_1,
  },
  restoreText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  hero: {
    marginTop: SPACING.space_4,
  },
  headline: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  blankStage: {
    flex: 1,
    marginTop: SPACING.space_6,
    marginBottom: SPACING.space_5,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bottomPanel: {
    paddingBottom: SPACING.space_5,
    gap: SPACING.space_3,
  },
  noPayment: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  pricingFootnote: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
