import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeOut, useSharedValue, withSpring } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { useHaptics } from '@/hooks/useHaptics';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizSymptoms'>;

interface Symptom {
  id: string;
  label: string;
  category: string;
  emoji: string;
}

const SYMPTOMS: Symptom[] = [
  // Mental
  { id: 'unmotivated', label: 'Feeling unmotivated', category: 'Mental', emoji: '😞' },
  { id: 'no_ambition', label: 'Lack of ambition to pursue goals', category: 'Mental', emoji: '🛋️' },
  { id: 'concentration', label: 'Difficulty concentrating', category: 'Mental', emoji: '🧠' },
  { id: 'memory', label: "Poor memory or 'brain fog'", category: 'Mental', emoji: '🌫️' },
  { id: 'anxiety', label: 'General anxiety', category: 'Mental', emoji: '😰' },
  { id: 'fomo', label: 'Fear of missing out (FOMO)', category: 'Mental', emoji: '⏳' },

  // Social
  { id: 'low_confidence', label: 'Low self-confidence', category: 'Social', emoji: '😔' },
  { id: 'comparison', label: 'Constantly comparing to others', category: 'Social', emoji: '📱' },
  { id: 'time_waste', label: 'Wasting hours scrolling', category: 'Social', emoji: '🌀' },
  { id: 'no_socialize', label: 'Reduced desire to socialize', category: 'Social', emoji: '🙅‍♂️' },
  { id: 'isolated', label: 'Feeling isolated from others', category: 'Social', emoji: '🚪' },

  // Physical
  { id: 'sleep', label: 'Poor sleep quality', category: 'Physical', emoji: '😴' },
  { id: 'eye_strain', label: 'Eye strain or headaches', category: 'Physical', emoji: '👀' },
  { id: 'posture', label: 'Poor posture', category: 'Physical', emoji: '🪑' },
];

export default function QuizSymptomsScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const { setSymptomsSelected } = useOnboardingAssessment();
  const selectedCount = selectedSymptoms.length;
  const badgeScale = useSharedValue(1);
  const { trigger } = useHaptics();
  const insets = useSafeAreaInsets();

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleContinue = () => {
    setSymptomsSelected(selectedSymptoms);
    navigation.navigate('QuizSupportNeed');
  };

  const getSymptomsByCategory = (category: string) => {
    return SYMPTOMS.filter(s => s.category === category);
  };

  const renderCategory = (category: string) => {
    const symptoms = getSymptomsByCategory(category);

    return (
      <Animated.View key={category} entering={FadeInUp.delay(100)} style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {symptoms.map(symptom => {
          const isSelected = selectedSymptoms.includes(symptom.id);
          return (
            <SymptomTag
              key={symptom.id}
              label={symptom.label}
              emoji={symptom.emoji}
              active={isSelected}
              onToggle={() => {
                toggleSymptom(symptom.id);
                trigger('light');
                badgeScale.value = 1.15;
                badgeScale.value = withSpring(1, { mass: 0.6, damping: 12, stiffness: 220 });
              }}
            />
          );
        })}
      </Animated.View>
    );
  };

  const selectedBadgeStyle = useMemo(() => ({
    transform: [{ scale: badgeScale.value }],
  }), [badgeScale]);

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
          <Text style={styles.title}>How is social media affecting you?</Text>
          <Text style={styles.subtitle}>Select every symptom you’re noticing so we can tailor your plan.</Text>
          <Animated.View style={[styles.badge, selectedBadgeStyle]} entering={FadeIn.delay(300)}>
            <Text style={styles.badgeText}>{selectedCount} selected</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={styles.banner}>
          <Text style={styles.bannerText}>
            Pinpointing your pain points helps Unscroller target the routines and guardrails you’ll feel fastest.
          </Text>
        </Animated.View>

        {renderCategory('Mental')}
        {renderCategory('Social')}
        {renderCategory('Physical')}

        <View style={styles.bottomSpacer} />
      </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.space_1) }]}>
          <WatercolorButton 
            color="yellow" 
            onPress={handleContinue}
            style={[selectedCount === 0 && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {selectedCount > 0 ? 'Continue your journey' : 'Select at least one'}
            </Text>
          </WatercolorButton>
          <Text style={styles.bottomHint}>This helps us gauge impact intensity before crafting your plan.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

interface SymptomTagProps {
  label: string;
  emoji: string;
  active: boolean;
  onToggle: () => void;
}

function SymptomTag({ label, emoji, active, onToggle }: SymptomTagProps) {
  return (
    <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOut.duration(150)}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.symptomOuter,
          active && styles.symptomOuterActive,
          pressed && styles.symptomOuterPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <View style={styles.symptomContent}>
          <Text style={styles.symptomEmoji} accessibilityElementsHidden>
            {emoji}
          </Text>
          <Text style={[styles.symptomLabel, active && styles.symptomLabelActive]}>{label}</Text>
        </View>
        <View style={[styles.symptomCheck, active && styles.symptomCheckActive]}>
          {active && <Text style={styles.symptomCheckText}>✓</Text>}
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
  header: {
    paddingTop: SPACING.space_6,
    gap: SPACING.space_3,
  },
  eyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#6b7280',
    letterSpacing: 2,
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
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    paddingVertical: SPACING.space_1,
    paddingHorizontal: SPACING.space_2,
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
    marginTop: SPACING.space_3,
  },
  bannerText: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 26,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.space_7,
    gap: SPACING.space_5,
    paddingHorizontal: SPACING.space_4,
  },
  bottomSpacer: {
    height: SPACING.space_5,
  },
  categoryContainer: {
    gap: SPACING.space_3,
  },
  categoryTitle: {
    ...TYPOGRAPHY.H3,
    fontSize: 24,
    color: '#1f2937',
  },
  symptomOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_4,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fffef9',
  },
  symptomOuterPressed: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  symptomOuterActive: {
    borderColor: '#1f2937',
    backgroundColor: '#1f2937',
  },
  symptomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    flex: 1,
  },
  symptomEmoji: {
    fontSize: 24,
  },
  symptomLabel: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#1f2937',
    flex: 1,
  },
  symptomLabelActive: {
    color: '#FFFFFF',
  },
  symptomCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symptomCheckActive: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  symptomCheckText: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    color: '#fffef9',
  },
  bottomBar: {
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_2,
    paddingBottom: SPACING.space_2,
    gap: SPACING.space_2,
    backgroundColor: '#fdfbf7',
    borderTopWidth: 1.2,
    borderTopColor: '#e5e7eb',
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
