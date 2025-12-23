import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'FunFacts'>;

interface FunFact {
  id: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

const FUN_FACTS: FunFact[] = [
  {
    id: 1,
    title: 'Built to Hook You',
    description: 'Social media apps are engineered to be addictive. Infinite scroll, auto-play videos, and constant notifications trigger dopamine in your brain to keep you coming back.',
    emoji: '🧠',
    color: '#ff2d55',
  },
  {
    id: 2,
    title: 'A Daily Scrolling Marathon',
    description: 'The average person scrolls about 300 feet of content each day — roughly the height of the Statue of Liberty. All that mindless scrolling quietly eats your time.',
    emoji: '📱',
    color: '#5856d6',
  },
  {
    id: 3,
    title: 'Hurts Your Sleep',
    description: 'Late-night scrolling tricks your brain. Blue light and constant stimulation make it harder to fall asleep, so you wake up tired and less focused.',
    emoji: '😴',
    color: '#007aff',
  },
  {
    id: 4,
    title: 'The Comparison Trap',
    description: 'Seeing everyone’s highlight reels can fuel anxiety and low self-esteem. The more we scroll, the more we compare — and often the worse we feel.',
    emoji: '💭',
    color: '#34c759',
  },
  {
    id: 5,
    title: 'Breaks Boost Your Brain',
    description: 'Even short breaks from social media improve mood and focus. Cutting back just a bit can lower stress and free up mental energy.',
    emoji: '🎯',
    color: '#ff9500',
  },
];

export default function FunFactsScreen({ navigation }: Props) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  const currentFact = FUN_FACTS[currentFactIndex];
  const isLastFact = currentFactIndex === FUN_FACTS.length - 1;

  const handleNext = () => {
    if (isLastFact) {
      // Go to motivational facts
      navigation.navigate('MotivationalFacts');
    } else {
      setCurrentFactIndex(currentFactIndex + 1);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>UNSCROLLER</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{currentFact.emoji}</Text>
          </View>
          <View style={styles.questionMark}>
            <Text style={styles.questionMarkText}>?</Text>
          </View>
        </View>

        {/* Fun Fact */}
        <View style={styles.factContainer}>
          <Text style={styles.factTitle}>{currentFact.title}</Text>
          <Text style={styles.factDescription}>{currentFact.description}</Text>
        </View>
      </View>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {FUN_FACTS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentFactIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <WatercolorButton color="yellow" onPress={handleNext}>
          <Text style={styles.buttonText}>{isLastFact ? 'Get Started →' : 'Next →'}</Text>
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
  logoContainer: {
    marginTop: SPACING.space_6,
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
    letterSpacing: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_5,
    position: 'relative',
  },
  emojiCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fffef9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  emoji: {
    fontSize: 80,
  },
  questionMark: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 125, 255, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionMarkText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  factContainer: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  factTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 34,
  },
  factDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.space_4,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  paginationDotActive: {
    backgroundColor: '#fbbf24',
    width: 24,
  },
  actions: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
