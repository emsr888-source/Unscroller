import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Congratulations'>;

export default function CongratulationsScreen({ navigation }: Props) {
  const user = useAppStore(state => state.user);
  const userName = user?.email?.split('@')[0] || 'Friend';

  const handleContinue = () => {
    navigation.navigate('SuccessFlow');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <View style={styles.logoContainer}>
        <Text style={styles.logo}>UNSCROLLER</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Nice work, {userName}!{'\n'}
          You're off to a great start.
        </Text>

        <View style={styles.card}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Milestone unlocked</Text>
          </View>

          <View style={styles.illustration}>
            <View style={styles.rocketContainer}>
              <View style={[styles.blob, styles.blob1]} />
              <View style={[styles.blob, styles.blob2]} />
              <View style={styles.rocket}>
                <View style={styles.rocketWindow} />
                <View style={styles.rocketBody} />
                <View style={styles.rocketFire} />
              </View>
              <View style={styles.gridPattern} />
            </View>
          </View>

          <Text style={styles.subtitle}>
            You've completed onboarding and are set up to build with focus.
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="Continue" onPress={handleContinue} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    paddingTop: SPACING.space_6,
    alignItems: 'center',
  },
  logo: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_4,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: SPACING.space_5,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
    padding: SPACING.space_5,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
    alignItems: 'center',
  },
  badgePill: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 12,
  },
  badgePillText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.BACKGROUND_ELEVATED,
    fontFamily: 'Inter-SemiBold',
  },
  illustration: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_4,
    marginTop: SPACING.space_3,
  },
  rocketContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 60,
    height: 80,
    backgroundColor: '#FFE3EF',
    top: '20%',
    left: '15%',
  },
  blob2: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF4CC',
    bottom: '25%',
    right: '10%',
  },
  rocket: {
    width: 120,
    height: 160,
    alignItems: 'center',
    zIndex: 1,
  },
  rocketWindow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    marginBottom: SPACING.space_1,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  rocketBody: {
    width: 80,
    height: 100,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 40,
    marginBottom: SPACING.space_1,
  },
  rocketFire: {
    width: 30,
    height: 40,
    backgroundColor: COLORS.ACCENT_GRADIENT_END,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  gridPattern: {
    position: 'absolute',
    bottom: '10%',
    left: '25%',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(20, 26, 38, 0.06)',
    transform: [{ rotate: '45deg' }],
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
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
