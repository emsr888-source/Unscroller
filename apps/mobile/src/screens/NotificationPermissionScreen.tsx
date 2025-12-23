import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { SPACING } from '@/core/theme/spacing';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import { notificationService } from '@/services/notificationService';

const CTA_LABEL = 'Continue for FREE';
const HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationPermission'>;

export default function NotificationPermissionScreen({ navigation }: Props) {
  const [requesting, setRequesting] = useState(false);

  const handleContinue = async () => {
    setRequesting(true);
    try {
      await notificationService.initialize();
    } catch (error) {
      console.warn('[NotificationPermission] permission request failed', error);
    } finally {
      setRequesting(false);
      navigation.navigate('Paywall');
    }
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
          <Text style={styles.title}>We'll send you a reminder before your free trial ends</Text>
          <View style={styles.illustration} accessibilityRole="image">
            <View style={styles.bellCircle}>
              <Text style={styles.bellIcon}>🔔</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.noPayment}>✓ No Payment Due Now</Text>
          <PrimaryButton
            title={requesting ? 'Continuing…' : CTA_LABEL}
            onPress={handleContinue}
            disabled={requesting}
          />
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
    alignItems: 'center',
    paddingHorizontal: SPACING.space_2,
    gap: SPACING.space_6,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.H1,
    textAlign: 'center',
    color: COLORS.TEXT_PRIMARY,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E5EBEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 72,
  },
  badge: {
    position: 'absolute',
    top: 36,
    right: 70,
    backgroundColor: '#F43F5E',
    borderRadius: 18,
    paddingHorizontal: SPACING.space_2,
    paddingVertical: 6,
  },
  badgeText: {
    ...TYPOGRAPHY.H4,
    color: '#FFFFFF',
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
