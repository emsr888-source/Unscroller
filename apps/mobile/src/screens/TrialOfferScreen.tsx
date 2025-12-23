import React from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

const CTA_LABEL = 'Start My 3-Day Free Trial';
const HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };

type Props = NativeStackScreenProps<RootStackParamList, 'TrialOffer'>;

export default function TrialOfferScreen({ navigation }: Props) {
  const handleStartTrial = () => {
    navigation.navigate('Paywall');
  };

  const handleRestore = () => {
    navigation.navigate('Paywall');
  };

  return (
    <ScreenWrapper edges={['bottom']} contentStyle={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} hitSlop={HIT_SLOP}>
            <Text style={styles.restoreText}>Restore</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Start your 3-day FREE trial to continue.</Text>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.timelineIcon}>🔓</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Today</Text>
                <Text style={styles.timelineDetail}>Unlock all the app's features like AI calorie scanning and more.</Text>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.timelineIcon}>🔔</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>In 2 Days - Reminder</Text>
                <Text style={styles.timelineDetail}>We'll send you a reminder that your trial is ending soon.</Text>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#0F0F0F' }]}>
                <Text style={styles.timelineIcon}>🏁</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>In 3 Days - Billing Starts</Text>
                <Text style={styles.timelineDetail}>You'll be charged on Dec 12, 2025 unless you cancel anytime before.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.noPayment}>✓ No Payment Due Now</Text>
          <PrimaryButton title={CTA_LABEL} onPress={handleStartTrial} />
          <Text style={styles.footnote}>Just $39.99 per year ($3.33/mo)</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  page: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_7,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_5,
  },
  backButton: {
    paddingVertical: SPACING.space_1,
    paddingRight: SPACING.space_2,
  },
  backIcon: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_SECONDARY,
  },
  restoreButton: {
    paddingVertical: SPACING.space_1,
    paddingHorizontal: SPACING.space_2,
  },
  restoreText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.H1,
    textAlign: 'center',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_6,
  },
  timeline: {
    paddingHorizontal: SPACING.space_2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_6,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.space_4,
  },
  timelineIcon: {
    fontSize: 20,
  },
  timelineContent: {
    flex: 1,
    paddingTop: SPACING.space_1,
  },
  timelineTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_1,
  },
  timelineDetail: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  bottomPanel: {
    gap: SPACING.space_3,
    paddingBottom: SPACING.space_5,
  },
  noPayment: {
    ...TYPOGRAPHY.Body,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  footnote: {
    ...TYPOGRAPHY.Subtext,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
  },
});
