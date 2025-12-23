import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'Info'>;

const FACTS = [
  {
    id: 1,
    icon: '🧠',
    title: 'Dopamine Reset',
    description: 'Your brain needs 90 days to reset its dopamine receptors. Every day counts.',
  },
  {
    id: 2,
    icon: '⏰',
    title: 'Average Time Wasted',
    description: 'The average person spends 2.5 hours daily scrolling. That\'s 912 hours per year!',
  },
  {
    id: 3,
    icon: '🎯',
    title: 'Focus & Flow',
    description: 'It takes 23 minutes to regain focus after a distraction. Protect your deep work time.',
  },
  {
    id: 4,
    icon: '💡',
    title: 'Creator Mindset',
    description: 'Creators consume with intent. Consumers scroll without purpose. Choose creation.',
  },
  {
    id: 5,
    icon: '📈',
    title: 'Compound Growth',
    description: '1% better each day = 37x better in a year. Small wins compound into massive results.',
  },
  {
    id: 6,
    icon: '🚀',
    title: 'Ship, Don\'t Perfect',
    description: 'Done is better than perfect. Ship your work, get feedback, iterate. Build in public.',
  },
];

export default function InfoScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  return (
    <ScreenWrapper contentStyle={isCompact ? styles.safeAreaCompact : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      
      <View style={styles.stars}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.3,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Learn & Grow</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Knowledge is Power</Text>
          <Text style={styles.heroSubtitle}>
            Understanding the science behind your transformation
          </Text>
        </View>

        <View style={styles.factsList}>
          {FACTS.map(fact => (
            <View key={fact.id} style={styles.factCard}>
              <View style={styles.factIcon}>
                <Text style={styles.factIconText}>{fact.icon}</Text>
              </View>
              <View style={styles.factContent}>
                <Text style={styles.factTitle}>{fact.title}</Text>
                <Text style={styles.factDescription}>{fact.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Want to Learn More?</Text>
          <Text style={styles.ctaText}>
            Join our community for daily tips, science-backed strategies, and support from fellow builders.
          </Text>
          <PrimaryButton
            title="Join Community"
            onPress={() => navigation.navigate('Community')}
            style={styles.ctaButton}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeAreaCompact: {},
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
    paddingBottom: SPACING.space_4,
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
    paddingHorizontal: SPACING.space_5,
    paddingVertical: SPACING.space_6,
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  heroTitle: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    maxWidth: 320,
  },
  factsList: {
    paddingHorizontal: SPACING.space_5,
    gap: SPACING.space_3,
  },
  factCard: {
    flexDirection: 'row',
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
  factIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(77, 161, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  factIconText: {
    fontSize: 28,
  },
  factContent: {
    flex: 1,
    gap: SPACING.space_1,
  },
  factTitle: {
    ...TYPOGRAPHY.Body,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  factDescription: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  ctaCard: {
    marginHorizontal: SPACING.space_5,
    marginTop: SPACING.space_6,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 18,
    padding: SPACING.space_5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    gap: SPACING.space_3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  ctaText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
