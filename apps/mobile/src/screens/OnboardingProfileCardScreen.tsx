import React from 'react';
import { View, Text, StyleSheet, StatusBar, useWindowDimensions, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppStore } from '@/store';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingProfileCard'>;

export default function OnboardingProfileCardScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const { height } = useWindowDimensions();
  const { setUserType } = useOnboardingAssessment();
  const isCompact = height < 720;
  const { user, setOnboardingCompleted } = useAppStore();
  const { firstName } = useOnboardingAssessment();
  const insets = useSafeAreaInsets();

  const derivedName = (() => {
    const trimmedFirst = firstName?.trim();
    if (trimmedFirst) {
      return trimmedFirst;
    }
    const fullName = user?.fullName?.trim();
    if (fullName && fullName.length > 0) {
      return fullName.split(' ')[0] || fullName;
    }
    const emailPrefix = user?.email?.split('@')[0]?.trim();
    if (emailPrefix && emailPrefix.length > 0) {
      return emailPrefix;
    }
    return 'Member';
  })();

  // Get user's start date or use today
  const startDate = new Date();
  const formattedDate = startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });

  const handleNext = () => {
    navigation.navigate('OnboardingPersona');
  };

  const handleDevSkip = () => {
    if (!__DEV__) {
      return;
    }
    setOnboardingCompleted(true);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, isCompact && styles.headerCompact]}>
            <Text style={styles.title}>{`Welcome aboard, ${derivedName}!`}</Text>
            <Text style={styles.subtitle}>This is your Progress Card — your personal tracker for your Unscroller journey.</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.cardContainer}>
            <WatercolorCard style={styles.card} backgroundColor="#fffef9" padding={SPACING.space_5}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>U</Text>
                </View>
                <View style={styles.sparkle}>
                  <Text style={styles.sparkText}>✨</Text>
                </View>
              </View>

              {/* Streak Display */}
              <View style={styles.streakContainer}>
                <Text style={styles.streakLabel}>Active Streak</Text>
                <Text style={styles.streakValue}>0 days</Text>
                <Text style={styles.streakHint}>Each day without endless scrolling keeps this streak climbing.</Text>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Name</Text>
                  <Text style={styles.footerValue}>{derivedName}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Started</Text>
                  <Text style={styles.footerValue}>{formattedDate}</Text>
                </View>
              </View>
            </WatercolorCard>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.space_2 }]}>
          <Text style={styles.bottomText}>Now, let's set up Unscroller for you.</Text>
          {__DEV__ && (
            <TouchableOpacity style={styles.devSkipButton} onPress={handleDevSkip} activeOpacity={0.85}>
              <Text style={styles.devSkipText}>Skip to Home (DEV)</Text>
            </TouchableOpacity>
          )}
          <WatercolorButton
            color="yellow"
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </WatercolorButton>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.space_6,
    gap: SPACING.space_5,
  },
  scrollContentCompact: {
    paddingTop: SPACING.space_4,
    gap: SPACING.space_4,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#1f2937',
    marginLeft: SPACING.space_4,
    marginBottom: SPACING.space_3,
  },
  backButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  header: {
    marginTop: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    marginBottom: SPACING.space_5,
  },
  headerCompact: {
    marginTop: SPACING.space_5,
    marginBottom: SPACING.space_3,
    paddingHorizontal: SPACING.space_4,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: SPACING.space_2,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
  },
  cardContainer: {
    paddingHorizontal: SPACING.space_5,
    marginTop: SPACING.space_2,
    marginBottom: SPACING.space_4,
  },
  card: {
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_6,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
  },
  logoText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 26,
  },
  sparkle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkText: {
    fontSize: 32,
  },
  streakContainer: {
    marginBottom: SPACING.space_5,
  },
  streakLabel: {
    fontFamily: 'PatrickHand-Regular',
    color: '#6b7280',
    fontSize: 16,
    marginBottom: SPACING.space_1,
  },
  streakValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 48,
    color: '#1f2937',
    lineHeight: 56,
  },
  streakHint: {
    fontFamily: 'PatrickHand-Regular',
    color: '#6b7280',
    fontSize: 15,
    marginTop: SPACING.space_1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.2,
    borderTopColor: '#e5e7eb',
    paddingTop: SPACING.space_3,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontFamily: 'PatrickHand-Regular',
    color: '#6b7280',
    fontSize: 14,
    marginBottom: SPACING.space_1,
  },
  footerValue: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 20,
  },
  bottomBar: {
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_3,
  },
  bottomText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: SPACING.space_4,
  },
  nextButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  devSkipButton: {
    marginBottom: SPACING.space_2,
    paddingVertical: SPACING.space_2,
    paddingHorizontal: SPACING.space_3,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#9ca3af',
    backgroundColor: '#f3f4f6',
    alignSelf: 'center',
  },
  devSkipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#6b7280',
  },
});
