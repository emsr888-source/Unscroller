import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitsGuide'>;

const HABITS = [
  {
    id: 1,
    icon: '⏰',
    title: 'Set creation time blocks',
    description: 'Dedicate focused time to building your projects',
  },
  {
    id: 2,
    icon: '🎯',
    title: 'Track your real-life progress',
    description: 'Level up in life, not just on social media',
  },
  {
    id: 3,
    icon: '🚀',
    title: 'Daily creator challenge',
    description: 'Build something every day, no matter how small',
  },
];

export default function HabitsGuideScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  
  // Calculate quit date (90 days from now)
  const quitDate = new Date();
  quitDate.setDate(quitDate.getDate() + 90);
  const formattedQuitDate = quitDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleContinue = () => {
    navigation.navigate('TakeBackControl');
  };

  return (
    <SafeAreaView style={[styles.safeArea, isCompact && styles.safeAreaCompact]} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      
      {/* Stars background */}
      <View style={styles.starsContainer}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            {/* Hand Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.handIcon}>✋</Text>
            </View>

            <Text style={styles.cardTitle}>From Consumer to Creator</Text>
            
            <Text style={styles.cardDescription}>
              Build focus, create daily, and achieve your dreams. Transform wasted scrolling time into productive creation time.
            </Text>

            {/* Quit Date */}
            <View style={styles.quitDateSection}>
              <Text style={styles.quitDateLabel}>Your transformation milestone:</Text>
              <View style={styles.quitDateBox}>
                <Text style={styles.quitDateText}>{formattedQuitDate}</Text>
              </View>
            </View>

            {/* How to reach goal */}
            <Text style={styles.sectionTitle}>Your daily creator routine:</Text>

            {/* Habits List */}
            <View style={styles.habitsList}>
              {HABITS.map(habit => (
                <View key={habit.id} style={styles.habitItem}>
                  <View style={styles.habitIcon}>
                    <Text style={styles.habitIconText}>{habit.icon}</Text>
                  </View>
                  <View style={styles.habitContent}>
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

      <View style={{ height: 140 }} />
    </ScrollView>

    {/* CTA Button */}
    <View style={styles.bottomContainer}>
      <PrimaryButton title="Buy Back Your Time" onPress={handleContinue} style={styles.ctaButton} />
      <Text style={styles.disclaimer}>
        Subscription appears discretely{'\n'}
        Cancel Anytime ✅ Take Control 🛡️
      </Text>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  safeAreaCompact: {
    // Compact layout adjustments
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
  },
  card: {
    backgroundColor: COLORS.GLASS_TINT,
    borderRadius: 24,
    padding: SPACING.space_5,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  cardContent: {
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  iconContainer: {
    marginBottom: SPACING.space_2,
  },
  handIcon: {
    fontSize: 48,
  },
  cardTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  cardDescription: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  quitDateSection: {
    alignItems: 'center',
    width: '100%',
    gap: SPACING.space_2,
  },
  quitDateLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  quitDateBox: {
    backgroundColor: 'rgba(160, 96, 255, 0.18)',
    paddingHorizontal: SPACING.space_5,
    paddingVertical: SPACING.space_3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  quitDateText: {
    ...TYPOGRAPHY.Body,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    width: '100%',
  },
  habitsList: {
    width: '100%',
    gap: SPACING.space_3,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.space_3,
  },
  habitIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  habitIconText: {
    fontSize: 28,
  },
  habitContent: {
    flex: 1,
    justifyContent: 'center',
  },
  habitTitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    lineHeight: 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_5,
    paddingTop: SPACING.space_4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    gap: SPACING.space_3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaButton: {
    width: '100%',
  },
  ctaButtonText: {
    ...TYPOGRAPHY.Body,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
});
