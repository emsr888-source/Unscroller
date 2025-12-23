import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { SupportNeed, useOnboardingAssessment } from '@/store/onboardingAssessment';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type FeatureOption = {
  id: string;
  supportNeed: Exclude<SupportNeed, 'all'>;
  label: string;
  emoji: string;
  description: string;
};

const FEATURE_OPTIONS: FeatureOption[] = [
  {
    id: 'limit_time_caps',
    supportNeed: 'limit_time',
    label: 'Daily time caps',
    emoji: '⏳',
    description: 'Set limits on social apps to keep scrolling in check.',
  },
  {
    id: 'limit_time_guardrails',
    supportNeed: 'limit_time',
    label: 'Scrolling guardrails',
    emoji: '🛡️',
    description: 'Speed bumps that interrupt compulsive scrolling patterns.',
  },
  {
    id: 'block_content_filters',
    supportNeed: 'block_content',
    label: 'Content filters',
    emoji: '🚫',
    description: 'Filter out doomscroll bait and triggering content.',
  },
  {
    id: 'block_content_focus',
    supportNeed: 'block_content',
    label: 'Deep work protection',
    emoji: '🎯',
    description: 'Block distractions during your most important work windows.',
  },
  {
    id: 'find_motivation_nudges',
    supportNeed: 'find_motivation',
    label: 'Accountability nudges',
    emoji: '📣',
    description: 'Gentle reminders to stay on track with your goals.',
  },
  {
    id: 'find_motivation_streaks',
    supportNeed: 'find_motivation',
    label: 'Streak tracking',
    emoji: '🔥',
    description: 'Visual progress that builds momentum day by day.',
  },
  {
    id: 'productivity_tools_habits',
    supportNeed: 'productivity_tools',
    label: 'Habit grids',
    emoji: '📊',
    description: 'Track daily wins and build consistency visually.',
  },
  {
    id: 'productivity_tools_todos',
    supportNeed: 'productivity_tools',
    label: 'Focus to-do lists',
    emoji: '✅',
    description: 'Prioritize what matters without overwhelm.',
  },
  {
    id: 'productivity_tools_pomodoro',
    supportNeed: 'productivity_tools',
    label: 'Pomodoro timer',
    emoji: '⏱️',
    description: 'Time-boxed focus sessions with built-in breaks.',
  },
  {
    id: 'connect_cohorts',
    supportNeed: 'connect',
    label: 'Small cohorts',
    emoji: '👥',
    description: 'Join a tight-knit group on the same journey.',
  },
  {
    id: 'connect_sharing',
    supportNeed: 'connect',
    label: 'Progress sharing',
    emoji: '📈',
    description: 'Celebrate wins and stay inspired with peers.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'QuizSupportNeed'>;

export default function QuizSupportNeedScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const { setSupportNeed } = useOnboardingAssessment();
  const insets = useSafeAreaInsets();

  const selectedSummary = useMemo(() => {
    if (selectedFeatureIds.length === 0) {
      return '0 selected';
    }
    if (selectedFeatureIds.length === 1) {
      const option = FEATURE_OPTIONS.find(feature => feature.id === selectedFeatureIds[0]);
      return option?.label ?? '1 selected';
    }
    return `${selectedFeatureIds.length} selected`;
  }, [selectedFeatureIds]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatureIds(prev =>
      prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId],
    );
  };

  const handleContinue = () => {
    if (selectedFeatureIds.length === 0) {
      return;
    }
    const firstFeature = FEATURE_OPTIONS.find(option => option.id === selectedFeatureIds[0]);
    if (firstFeature) {
      setSupportNeed(firstFeature.supportNeed);
    }
    navigation.navigate('QuizResultLoading');
  };

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Which of these would help you most right now?</Text>
          <Text style={styles.subtitle}>Tap the support you’re craving most. We’ll anchor your plan around it.</Text>
          <Animated.View entering={FadeIn.delay(250)} style={styles.badge}>
            <Text style={styles.badgeText}>{selectedSummary}</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={styles.banner}>
          <Text style={styles.bannerText}>
            These aren’t random features—each combines coaching + product guardrails so you don’t have to rely on willpower alone.
          </Text>
        </Animated.View>

        <View style={styles.optionList}>
          {FEATURE_OPTIONS.map(option => (
            <SupportNeedCard
              key={option.id}
              option={option}
              active={selectedFeatureIds.includes(option.id)}
              onSelect={() => toggleFeature(option.id)}
            />
          ))}
        </View>
      </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.space_2) }]}>
          <WatercolorButton
            color="yellow"
            onPress={handleContinue}
            style={[selectedFeatureIds.length === 0 && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {selectedFeatureIds.length > 0 ? 'Continue' : 'Choose at least one'}
            </Text>
          </WatercolorButton>
          <Text style={styles.bottomHint}>We’ll highlight your pick inside the onboarding plan and toolkit.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

type CardProps = {
  option: (typeof FEATURE_OPTIONS)[number];
  active: boolean;
  onSelect: () => void;
};

function SupportNeedCard({ option, active, onSelect }: CardProps) {
  return (
    <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOut.duration(150)}>
      <Pressable
        onPress={onSelect}
        style={({ pressed }) => [
          styles.optionCard,
          active && styles.optionCardActive,
          pressed && styles.optionCardPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={option.label}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionEmoji} accessibilityElementsHidden>
            {option.emoji}
          </Text>
          <View style={styles.optionTextGroup}>
            <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
            <Text style={[styles.optionDescription, active && styles.optionDescriptionActive]}>{option.description}</Text>
          </View>
        </View>
        <View style={[styles.optionCheck, active && styles.optionCheckActive]}>
          {active && <Text style={styles.optionCheckText}>✓</Text>}
        </View>
      </Pressable>
    </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_5,
  },
  header: {
    paddingTop: SPACING.space_6,
    gap: SPACING.space_3,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 36,
    color: '#1f2937',
    lineHeight: 44,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#475569',
    lineHeight: 26,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    paddingVertical: SPACING.space_1,
    paddingHorizontal: SPACING.space_2,
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    ...TYPOGRAPHY.Subtext,
    fontSize: 16,
    color: '#1f2937',
  },
  banner: {
    backgroundColor: '#fffef9',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    padding: SPACING.space_4,
  },
  bannerText: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 26,
  },
  optionList: {
    gap: SPACING.space_3,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_4,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fffef9',
  },
  optionCardPressed: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  optionCardActive: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    flex: 1,
  },
  optionEmoji: {
    fontSize: 26,
  },
  optionTextGroup: {
    flex: 1,
    gap: SPACING.space_1,
  },
  optionLabel: {
    ...TYPOGRAPHY.Body,
    fontSize: 20,
    color: '#1f2937',
  },
  optionLabelActive: {
    color: '#FFFFFF',
  },
  optionDescription: {
    ...TYPOGRAPHY.Subtext,
    fontSize: 16,
    color: '#6b7280',
  },
  optionDescriptionActive: {
    color: '#e5e7eb',
  },
  optionCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionCheckActive: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  optionCheckText: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#fffef9',
  },
  bottomBar: {
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_2,
    gap: SPACING.space_2,
    borderTopWidth: 1.2,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fdfbf7',
  },
  bottomHint: {
    ...TYPOGRAPHY.Subtext,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
