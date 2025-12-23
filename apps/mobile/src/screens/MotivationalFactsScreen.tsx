import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'MotivationalFacts'>;

interface MotivationalFact {
  id: number;
  title: string;
  description: string;
  illustration: string;
  accent: string;
}

const MOTIVATIONAL_FACTS: MotivationalFact[] = [
  {
    id: 1,
    title: 'Your Path to Recovery',
    description:
      'Good news: recovery is possible. No matter how long you’ve been stuck in the scroll, you can break free — step by step.',
    illustration: '🌱',
    accent: '#6CD69A',
  },
  {
    id: 2,
    title: 'Why Unscroller?',
    description:
      'Unscroller is your tool to take back control. We strip away the toxic parts of social media and leave you with what matters: DMs, posting, and real connection.',
    illustration: '🚀',
    accent: '#7BC8FF',
  },
  {
    id: 3,
    title: 'Rewire Your Brain',
    description:
      'Science-backed techniques help you unhook from dopamine loops. Focus sessions and mindful posting retrain your brain for deep work and calm.',
    illustration: '🧩',
    accent: '#F7B267',
  },
  {
    id: 4,
    title: '90-Day Transformation',
    description:
      'Stick with it and you’ll feel the difference. Around 90 days of reduced scrolling is enough for most people to feel a big shift in mood and focus.',
    illustration: '📈',
    accent: '#A78BFA',
  },
  {
    id: 5,
    title: 'Break the Cycle',
    description:
      'Every day you scroll, you strengthen the habit. Every day you don’t, you weaken it. We’ll help you replace the scroll cycle with a healthier routine.',
    illustration: '😴',
    accent: '#FF9FB2',
  },
  {
    id: 6,
    title: 'Reclaim Your Time',
    description:
      'The average person spends about 2 hours and 20–25 minutes on social media every day. Unscroller shows you how much you’re getting back — and what’s possible when you invest that time in yourself.',
    illustration: '⏰',
    accent: '#7AE1C3',
  },
];

export default function MotivationalFactsScreen({ navigation }: Props) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const currentFact = MOTIVATIONAL_FACTS[currentFactIndex];
  const isLastFact = currentFactIndex === MOTIVATIONAL_FACTS.length - 1;

  const handleNext = () => {
    if (isLastFact) {
      navigation.navigate('ExpertQuotes');
    } else {
      setCurrentFactIndex(currentFactIndex + 1);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      <View style={styles.header}>
        <Text style={styles.badge}>Motivation #{currentFact.id}</Text>
        <Text style={styles.logo}>UNSCROLLER</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.illustrationCircle, { backgroundColor: `${currentFact.accent}22`, borderColor: currentFact.accent }]}>
          <Text style={styles.emoji}>{currentFact.illustration}</Text>
        </View>

        <View style={styles.factContainer}>
          <Text style={styles.factTitle}>{currentFact.title}</Text>
          <Text style={styles.factDescription}>{currentFact.description}</Text>
        </View>

        {currentFactIndex === 1 && (
          <View style={styles.badgesContainer}>
            <Text style={styles.badgeText}>Featured in</Text>
            <View style={styles.badges}>
              {['Forbes', 'Tech Crunch', 'Wired'].map(outlet => (
                <View key={outlet} style={styles.badgePill}>
                  <Text style={styles.badgeName}>{outlet}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.paginationContainer}>
        {MOTIVATIONAL_FACTS.map((_, index) => (
          <View key={index} style={[styles.paginationDot, index === currentFactIndex && styles.paginationDotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <WatercolorButton color="yellow" onPress={handleNext}>
          <Text style={styles.buttonText}>{isLastFact ? 'Continue →' : 'Next →'}</Text>
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
  header: {
    paddingTop: SPACING.space_6,
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fbbf24',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 12,
  },
  logo: {
    fontFamily: 'PatrickHand-Regular',
    color: '#475569',
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  illustrationCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 100,
  },
  factContainer: {
    alignItems: 'center',
    gap: SPACING.space_2,
    paddingHorizontal: SPACING.space_2,
  },
  factTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 40,
  },
  factDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
  badgesContainer: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  badgeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  badgePill: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: '#fffef9',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  badgeName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.space_2,
    marginBottom: SPACING.space_3,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#fbbf24',
  },
  actions: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_2,
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
