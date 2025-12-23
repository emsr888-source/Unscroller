import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { notificationService } from '@/services/notificationService';
import { AnimationStagger } from '@/constants/design';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingNotifications'>;

const NOTIFICATION_BENEFITS = [
  {
    icon: '⏰',
    title: 'Smart Reminders',
    description: 'Get nudges right before your typical scroll times',
  },
  {
    icon: '🎯',
    title: 'Focus Prompts',
    description: 'Reminders for deep work when you need them most',
  },
  {
    icon: '🔥',
    title: 'Streak Protection',
    description: 'Never lose your progress with timely alerts',
  },
  {
    icon: '🎉',
    title: 'Milestone Celebrations',
    description: 'Get celebrated when you hit major achievements',
  },
];

export default function OnboardingNotificationsScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const [isRequesting, setIsRequesting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await notificationService.initialize();
      
      if (granted) {
        // Success - notifications enabled
        console.log('✅ Notifications enabled');
        
        // Schedule initial smart reminders
        notificationService.scheduleSmartReminders({
          typicalScrollTime: '21:00', // Default, can be personalized later
          preferredFocusTime: '14:00',
          streakDays: 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
    } catch (error) {
      console.error('Error requesting notifications:', error);
    } finally {
      setIsRequesting(false);
      // Navigate to next screen regardless
      navigation.navigate('PlanPreview');
    }
  };

  const handleSkip = () => {
    console.log('⏭️ User skipped notifications');
    navigation.navigate('PlanPreview');
  };

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, SPACING.space_3) }]}>
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(0)}
            style={styles.header}
          >
            <Text style={styles.icon}>🔔</Text>
            <Text style={styles.title}>Stay on Track</Text>
            <Text style={styles.subtitle}>
              Smart notifications help you build habits that stick
            </Text>
          </Animated.View>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            {NOTIFICATION_BENEFITS.map((benefit, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay((index + 1) * AnimationStagger.list)}
              >
                <WatercolorCard style={styles.benefitCard} backgroundColor="#fffef9" padding={SPACING.space_4}>
                  <View style={styles.benefitIcon}>
                    <Text style={styles.benefitIconText}>{benefit.icon}</Text>
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </WatercolorCard>
              </Animated.View>
            ))}
          </View>

          {/* Privacy Note */}
          <Animated.View entering={FadeInDown.delay(5 * AnimationStagger.list)}>
            <WatercolorCard style={styles.privacyNote} backgroundColor="#fef3c7" padding={SPACING.space_3}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text style={styles.privacyText}>
                We respect your schedule. Set quiet hours anytime in settings.
              </Text>
            </WatercolorCard>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(6 * AnimationStagger.list)}
            style={styles.actions}
          >
            <WatercolorButton
              color="yellow"
              onPress={handleEnableNotifications}
              style={[isRequesting && styles.buttonDisabled]}
            >
              <Text style={styles.enableButtonText}>
                {isRequesting ? 'Enabling...' : 'Enable Notifications'}
              </Text>
            </WatercolorButton>

            <WatercolorButton
              color="neutral"
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </WatercolorButton>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_6,
    justifyContent: 'space-between',
    gap: SPACING.space_5,
  },
  header: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 36,
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: SPACING.space_4,
  },
  benefitsList: {
    flex: 1,
    gap: SPACING.space_3,
    paddingVertical: SPACING.space_2,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.space_3,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIconText: {
    fontSize: 24,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 4,
  },
  benefitDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.space_3,
  },
  privacyIcon: {
    fontSize: 20,
  },
  privacyText: {
    flex: 1,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 20,
  },
  actions: {
    gap: SPACING.space_3,
  },
  enableButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  skipButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
