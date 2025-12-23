import React from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisComplete'>;

export default function AnalysisCompleteScreen({ navigation }: Props) {
  const handleContinue = () => {
    navigation.navigate('NotificationPermission');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      {/* Back Button */}
      <Pressable 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.backButtonText}>‹ Back</Text>
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Analysis Complete </Text>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.subtitle}>
          Here's what your habits reveal...
        </Text>

        <Text style={styles.message}>
          You're spending too much time{'\n'}scrolling instead of building*
        </Text>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            {/* Your Score Bar */}
            <View style={styles.barContainer}>
              <View style={[styles.bar, styles.barYour]} />
              <Text style={styles.barPercentage}>64%</Text>
              <Text style={styles.barLabel}>Your Score</Text>
            </View>

            {/* Average Bar */}
            <View style={styles.barContainer}>
              <View style={[styles.bar, styles.barAverage]} />
              <Text style={styles.barPercentage}>40%</Text>
              <Text style={styles.barLabel}>Average</Text>
            </View>
          </View>
        </View>

        {/* Result Message */}
        <Text style={styles.resultText}>
          <Text style={styles.resultHighlight}>64%</Text> more time wasted than average user 📊
        </Text>

        <Text style={styles.disclaimer}>
          * Based on your self-reported habits. Not a medical diagnosis.
        </Text>
      </View>

      {/* CTA Button */}
      <View style={styles.bottomContainer}>
        <PrimaryButton title="See Your Action Plan" onPress={handleContinue} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingTop: SPACING.space_5,
    paddingLeft: SPACING.space_5,
    paddingBottom: SPACING.space_3,
  },
  backButtonText: {
    color: COLORS.ACCENT_GRADIENT_START,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  checkmark: {
    color: COLORS.SUCCESS_GREEN,
    fontSize: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.space_4,
    textAlign: 'center',
  },
  message: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.space_5,
    lineHeight: 26,
  },
  chartContainer: {
    width: '100%',
    marginBottom: SPACING.space_4,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 220,
    gap: SPACING.space_6,
  },
  barContainer: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  bar: {
    width: 72,
    borderRadius: 12,
  },
  barYour: {
    height: 180,
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  barAverage: {
    height: 120,
    backgroundColor: COLORS.ACCENT_GRADIENT_END,
  },
  barPercentage: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  barLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
  resultText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.space_2,
  },
  resultHighlight: {
    color: COLORS.ACCENT_GRADIENT_START,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
  },
});
