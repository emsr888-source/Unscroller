import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'BenefitsShowcase'>;

const BENEFITS = [
  { id: 1, icon: '🎯', label: 'Deep Focus' },
  { id: 2, icon: '🚀', label: 'Build & Create' },
  { id: 3, icon: '⏰', label: 'Reclaim Your Time' },
  { id: 4, icon: '📈', label: 'Real Progress' },
  { id: 5, icon: '💡', label: 'Clear Thinking' },
  { id: 6, icon: '🎨', label: 'Creative Flow' },
];

export default function BenefitsShowcaseScreen({ navigation }: Props) {
  const stars = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
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
    navigation.navigate('HabitsGuide');
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
        <View style={styles.starsDecoration}>
          <Text style={styles.starLeft}>🏆</Text>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={styles.starIcon}>
              ⭐
            </Text>
          ))}
          <Text style={styles.starRight}>🏆</Text>
        </View>

        <Text style={styles.title}>Build Your Dreams,{"\n"}Not Your Scroll Count</Text>
        <Text style={styles.subtitle}>Transform. Create. Level Up.</Text>

        <View style={styles.badgesGrid}>
          {BENEFITS.map(benefit => (
            <View key={benefit.id} style={styles.badge}>
              <Text style={styles.badgeIcon}>{benefit.icon}</Text>
              <Text style={styles.badgeText}>{benefit.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.illustrationContainer}>
          <View style={styles.sunburst}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={[styles.sunburstRay, { transform: [{ rotate: `${i * 30}deg` }] }]} />
            ))}
            <View style={styles.meditationCircle}>
              <Text style={styles.meditationEmoji}>🧘</Text>
            </View>
          </View>
          <Text style={styles.illustrationLabel}>Conquer yourself</Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="Buy Back Your Time" onPress={handleContinue} />
        <Text style={styles.disclaimer}>
          Subscription appears discretely{"\n"}
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
  starsDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_4,
  },
  starLeft: {
    fontSize: 20,
    marginRight: SPACING.space_2,
  },
  starIcon: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  starRight: {
    fontSize: 20,
    marginLeft: SPACING.space_2,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: SPACING.space_2,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.space_5,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.space_2,
    marginBottom: SPACING.space_5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 16,
    gap: SPACING.space_2,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'Inter-SemiBold',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: SPACING.space_3,
  },
  sunburst: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_3,
  },
  sunburstRay: {
    position: 'absolute',
    width: 60,
    height: 8,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
    borderRadius: 4,
  },
  meditationCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.ACCENT_GRADIENT_END,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  meditationEmoji: {
    fontSize: 48,
  },
  illustrationLabel: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
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
