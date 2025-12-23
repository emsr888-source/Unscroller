import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'OneTimeOffer'>;

export default function OneTimeOfferScreen({ navigation }: Props) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleClaim = () => {
    navigation.navigate('NotificationPermission');
  };

  const handleStayStuck = () => {
    navigation.navigate('NotificationPermission');
  };

  const handleClose = () => {
    navigation.navigate('NotificationPermission');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={10}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>UNSCROLLER</Text>

        <Text style={styles.title}>One Time Offer</Text>
        <Text style={styles.subtitle}>
          Lock in the best price. It disappears after this screen.
        </Text>

        <View style={styles.discountCard}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Lowest price</Text>
          </View>
          <Text style={styles.discountPercentage}>80%</Text>
          <Text style={styles.discountLabel}>OFF your first year</Text>
          <View style={styles.timerPill}>
            <Text style={styles.timerPillLabel}>Offer expires in</Text>
            <Text style={styles.timer}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.pricingBadge}>
            <Text style={styles.pricingBadgeText}>68% OFF - BEST VALUE</Text>
          </View>
          <View style={styles.pricingContent}>
            <View>
              <Text style={styles.planName}>Annual Plan</Text>
              <Text style={styles.planDuration}>Billed as $77.77/year</Text>
              <Text style={styles.planOriginal}>Was $19.99/mo</Text>
            </View>
            <Text style={styles.planPrice}>$6.48/mo</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="Claim your offer now" onPress={handleClaim} />

        <TouchableOpacity style={styles.stayStuckButton} onPress={handleStayStuck}>
          <Text style={styles.stayStuckText}>I'll stay stuck</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Cancel anytime  ·  Take control{'\n'}
          Restore Purchase
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: SPACING.space_6,
    right: SPACING.space_5,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  closeButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.space_7,
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    alignItems: 'center',
  },
  logo: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: SPACING.space_2,
    textTransform: 'uppercase',
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_2,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.space_6,
    textAlign: 'center',
  },
  discountCard: {
    width: '100%',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_6,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    paddingVertical: SPACING.space_5,
    paddingHorizontal: SPACING.space_4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
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
  discountPercentage: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 70,
  },
  discountLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
    marginTop: SPACING.space_1,
  },
  timerPill: {
    marginTop: SPACING.space_4,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    borderRadius: 12,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
  },
  timerPillLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.space_1,
  },
  timer: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  pricingCard: {
    width: '100%',
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 16,
    padding: SPACING.space_4,
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  pricingBadge: {
    position: 'absolute',
    top: -10,
    left: SPACING.space_4,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 12,
  },
  pricingBadgeText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.BACKGROUND_ELEVATED,
    fontFamily: 'Inter-SemiBold',
  },
  pricingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_2,
  },
  planName: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_1,
  },
  planDuration: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  planOriginal: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: SPACING.space_1,
  },
  planPrice: {
    color: COLORS.ACCENT_GRADIENT_START,
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    borderTopWidth: 1,
    borderTopColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_MAIN,
    gap: SPACING.space_3,
  },
  stayStuckButton: {
    alignItems: 'center',
  },
  stayStuckText: {
    ...TYPOGRAPHY.Button,
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
