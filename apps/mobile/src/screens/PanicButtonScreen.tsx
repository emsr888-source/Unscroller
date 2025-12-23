import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { AnimationStagger } from '@/constants/design';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import { Siren } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'PanicButton'>;

const TECHNIQUES = [
  { id: 1, icon: '🌬️', title: 'Deep Breathing', subtitle: '4-7-8 technique', duration: '2 min' },
  { id: 2, icon: '🧘', title: 'Quick Meditation', subtitle: 'Calm your mind', duration: '5 min' },
  { id: 3, icon: '🚶', title: 'Take a Walk', subtitle: 'Move your body', duration: '10 min' },
  { id: 4, icon: '💧', title: 'Cold Water', subtitle: 'Splash your face', duration: '1 min' },
  { id: 5, icon: '📝', title: 'Journal', subtitle: 'Write it out', duration: '5 min' },
  { id: 6, icon: '☎️', title: 'Talk to Someone', subtitle: 'Visit Community Hub', duration: '10 min' },
];

export default function PanicButtonScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [isCalming, setIsCalming] = useState(false);

  const handleEmergency = () => {
    setIsCalming(true);
    // Start breathing exercise
  };

  const handleTechniquePress = (techniqueId: number) => {
    switch (techniqueId) {
      case 1:
        navigation.navigate('Reset');
        break;
      case 2:
        navigation.navigate('Meditation');
        break;
      case 5:
        navigation.navigate('Journal');
        break;
      case 6:
        navigation.navigate('CollaborationHub', { initialTab: 'partnerships' });
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollCompact]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Need Help?</Text>
            <View style={styles.headerSpacer} />
          </View>

          {!isCalming ? (
            <>
              <WatercolorCard style={styles.urgentCard}>
                <View style={styles.pulseContainer}>
                  <View style={styles.pulse} />
                  <View style={styles.pulse2} />
                  <TouchableOpacity style={styles.panicButton} onPress={handleEmergency} activeOpacity={0.92}>
                    <View style={styles.panicIconCircle}>
                      <Siren size={52} color="#b91c1c" strokeWidth={1.8} />
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.urgentTitle}>Feeling the Urge?</Text>
                <Text style={styles.urgentSubtitle}>Press the button. We’ll guide you through it.</Text>
              </WatercolorCard>

              <Text style={styles.sectionHero}>Quick Relief Techniques</Text>
              <View style={styles.techniquesList}>
                {TECHNIQUES.map((technique, index) => (
                  <Animated.View key={technique.id} entering={FadeInDown.delay(index * AnimationStagger.list)}>
                    <WatercolorCard style={styles.techniqueCard}>
                      <TouchableOpacity activeOpacity={0.9} style={styles.techniqueRow} onPress={() => handleTechniquePress(technique.id)}>
                        <View style={styles.techniqueIconWrap}>
                          <Text style={styles.techniqueIcon}>{technique.icon}</Text>
                        </View>
                        <View style={styles.techniqueContent}>
                          <Text style={styles.techniqueTitle}>{technique.title}</Text>
                          <Text style={styles.techniqueSubtitle}>{technique.subtitle}</Text>
                        </View>
                        <View style={styles.techniqueDuration}>
                          <Text style={styles.techniqueDurationText}>{technique.duration}</Text>
                        </View>
                      </TouchableOpacity>
                    </WatercolorCard>
                  </Animated.View>
                ))}
              </View>

              <WatercolorCard style={styles.motivationCard}>
                <Text style={styles.motivationIcon}>💪</Text>
                <Text style={styles.motivationTitle}>You’ve Got This</Text>
                <Text style={styles.motivationText}>The urge will pass. Stay grounded in the progress you’ve built.</Text>
              </WatercolorCard>
            </>
          ) : (
            <WatercolorCard style={styles.calmingCard}>
              <View style={styles.breathingCircle}>
                <Text style={styles.breathingText}>Breathe</Text>
              </View>
              <Text style={styles.calmingTitle}>Deep Breathing</Text>
              <Text style={styles.calmingInstructions}>
                Inhale for 4 seconds{'\n'}
                Hold for 7 seconds{'\n'}
                Exhale for 8 seconds
              </Text>
              <PrimaryButton title="I Feel Better" onPress={() => setIsCalming(false)} style={styles.doneButton} />
            </WatercolorCard>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_4,
  },
  scrollCompact: {
    paddingHorizontal: SPACING.space_3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
  },
  headerSpacer: {
    width: 44,
  },
  urgentCard: {
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  pulseContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  pulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
  },
  pulse2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  panicButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#f87171',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  panicIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#1f2937',
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  panicIcon: {
    fontSize: 52,
  },
  urgentTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 26,
    color: '#1f2937',
    textAlign: 'center',
  },
  urgentSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: SPACING.space_4,
  },
  sectionHero: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  techniquesList: {
    gap: SPACING.space_3,
  },
  techniqueCard: {
    padding: 0,
  },
  techniqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    gap: SPACING.space_3,
  },
  techniqueIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: SPACING.space_1,
  },
  techniqueIcon: {
    fontSize: 26,
  },
  techniqueContent: {
    flex: 1,
    gap: SPACING.space_1,
    paddingLeft: SPACING.space_1,
  },
  techniqueTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  techniqueSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  techniqueDuration: {
    minWidth: 86,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.space_1,
  },
  techniqueDurationText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1d4ed8',
  },
  motivationCard: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  motivationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  motivationTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  motivationText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  calmingCard: {
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderWidth: 3,
    borderColor: COLORS.ACCENT_GRADIENT_START,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  breathingText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 26,
    color: '#1f2937',
  },
  calmingTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
    textAlign: 'center',
  },
  calmingInstructions: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 28,
  },
  doneButton: {
    marginTop: SPACING.space_1,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
