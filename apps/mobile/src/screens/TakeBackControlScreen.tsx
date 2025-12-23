import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'TakeBackControl'>;

const BENEFITS = [
  { id: 1, icon: '🎯', text: 'Build unshakeable focus' },
  { id: 2, icon: '🚀', text: 'Create and ship your projects' },
  { id: 3, icon: '📈', text: 'Level up in real life' },
];

export default function TakeBackControlScreen({ navigation }: Props) {
  const stars = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        x: Math.random(),
        y: Math.random(),
        opacity: Math.random() * 0.4 + 0.2,
        size: Math.random() * 2 + 2,
      })),
    []
  );
  const { width, height } = Dimensions.get('window');

  const handleContinue = () => {
    navigation.navigate('Congratulations');
  };

  const handleClaimDiscount = () => {
    navigation.navigate('Congratulations');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <View style={styles.starsContainer}>
        {stars.map(star => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x * width,
                top: star.y * height,
                opacity: star.opacity,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🙌</Text>
        </View>

        <Text style={styles.title}>Build Your Future</Text>

        <View style={styles.benefitsList}>
          {BENEFITS.map(benefit => (
            <View key={benefit.id} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Text style={styles.benefitIconText}>{benefit.icon}</Text>
              </View>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ratingContainer}>
          <View style={styles.starsRating}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text key={i} style={styles.starIcon}>
                ⭐
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.message}>
          Stop wasting time scrolling. Start building your dreams. Transform from passive consumer to active creator.
        </Text>

        <View style={styles.discountCard}>
          <Text style={styles.discountTitle}>Special Discount!</Text>
          <Text style={styles.discountSubtitle}>Get 80% off on Unscroller Premium.</Text>
          <TouchableOpacity style={styles.claimButton} onPress={handleClaimDiscount}>
            <Text style={styles.claimButtonText}>Claim Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="Buy Back Your Time" onPress={handleContinue} />
        <Text style={styles.disclaimer}>
          Subscription appears discretely{'\n'}
          Cancel Anytime ✅ Take Control 🛡️
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.space_3,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.space_5,
    lineHeight: 42,
  },
  benefitsList: {
    width: '100%',
    gap: SPACING.space_3,
    marginBottom: SPACING.space_5,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIconText: {
    fontSize: 22,
  },
  benefitText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  ratingContainer: {
    marginBottom: SPACING.space_3,
  },
  starsRating: {
    flexDirection: 'row',
    gap: SPACING.space_1,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  starIcon: {
    fontSize: 20,
  },
  message: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.space_4,
  },
  discountCard: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
    padding: SPACING.space_4,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  discountTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_1,
  },
  discountSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.space_3,
    lineHeight: 22,
  },
  claimButton: {
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    paddingHorizontal: SPACING.space_5,
    paddingVertical: SPACING.space_2,
    borderRadius: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  claimButtonText: {
    ...TYPOGRAPHY.Button,
    color: COLORS.BACKGROUND_ELEVATED,
    fontWeight: '700',
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    borderTopWidth: 1,
    borderTopColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  disclaimer: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
