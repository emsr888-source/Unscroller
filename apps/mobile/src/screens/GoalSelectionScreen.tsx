import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import { useAppStore } from '@/store';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSelection'>;

const MAX_CHAR_COUNT = 220;

export default function GoalSelectionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const { thirtyDayGoal, setThirtyDayGoal } = useOnboardingAssessment();
  const { setProfileGoal } = useAppStore();
  const [goalDraft, setGoalDraft] = useState(thirtyDayGoal);

  const handleChange = (text: string) => {
    const nextValue = text.length > MAX_CHAR_COUNT ? text.slice(0, MAX_CHAR_COUNT) : text;
    setGoalDraft(nextValue);
    setThirtyDayGoal(nextValue);
    setProfileGoal(nextValue);
  };

  const isValid = useMemo(() => goalDraft.trim().length > 0, [goalDraft]);

  const handleContinue = () => {
    if (!isValid) {
      return;
    }
    navigation.navigate('Commitment');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(250)} style={styles.header}>
          <Text style={styles.title}>What do you want to accomplish in the next 30 days?</Text>
          <Text style={styles.subtitle}>
            Write the one outcome you want most. Be specific so we can weave it into your plan and track the win with you.
          </Text>
        </Animated.View>

        <WatercolorCard style={[styles.goalCard, isCompact && styles.goalCardCompact]}>
          <Text style={styles.promptLabel}>30-day target</Text>
          <TextInput
            style={styles.goalInput}
            multiline
            textAlignVertical="top"
            placeholder="Example: Ship the MVP of my app and onboard 10 beta users."
            placeholderTextColor="#9ca3af"
            value={goalDraft}
            onChangeText={handleChange}
            maxLength={MAX_CHAR_COUNT}
            accessibilityLabel="Describe your 30-day goal"
          />
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>We’ll show this on your profile so you stay accountable.</Text>
            <Text style={styles.charCount}>{`${goalDraft.length}/${MAX_CHAR_COUNT}`}</Text>
          </View>
        </WatercolorCard>
      </ScrollView>

      <View
        style={[
          styles.bottomContainer,
          isCompact && styles.bottomContainerCompact,
          { paddingBottom: Math.max(insets.bottom, SPACING.space_2) },
        ]}
      >
        <WatercolorButton color="yellow" onPress={isValid ? handleContinue : undefined}>
          <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>Save my 30-day goal</Text>
        </WatercolorButton>
        <Text style={styles.bottomHint}>You can update this anytime inside the app.</Text>
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
  header: {
    paddingTop: SPACING.space_6,
    gap: SPACING.space_3,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 17,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  scrollContentCompact: {
    paddingBottom: SPACING.space_4,
  },
  goalCard: {
    padding: SPACING.space_5,
    gap: SPACING.space_3,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  goalCardCompact: {
    padding: SPACING.space_3,
  },
  promptLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  goalInput: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fffef9',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    minHeight: 120,
    padding: SPACING.space_3,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    flex: 1,
    marginRight: SPACING.space_3,
  },
  charCount: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  ctaSpacer: {
    height: SPACING.space_7,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_2,
  },
  bottomContainerCompact: {
    paddingBottom: 0,
  },
  bottomHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
});
