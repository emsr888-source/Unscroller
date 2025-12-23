import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { useOnboardingAssessment, PersonaRole } from '@/store/onboardingAssessment';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

const PERSONA_OPTIONS: { id: PersonaRole; label: string }[] = [
  { id: 'builder', label: 'Builder / Entrepreneur' },
  { id: 'creator', label: 'Creator / Influencer' },
  { id: 'student', label: 'Student' },
  { id: 'professional', label: 'Professional / Knowledge worker' },
  { id: 'other', label: 'Multi-hyphenate / Other' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingPersona'>;

export default function OnboardingPersonaScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const { personaRoles, setPersonaRoles } = useOnboardingAssessment();
  const [selectedRole, setSelectedRole] = useState<PersonaRole | null>(personaRoles[0] ?? null);
  const progressValue = 0.25;
  const topPadding = SPACING.space_1;

  const handleSelectRole = (role: PersonaRole) => {
    setSelectedRole(role);
    setPersonaRoles([role]);
    navigation.navigate('OnboardingAge');
  };

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.page, { paddingTop: topPadding }]}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressValue * 100}%` }]} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.question}>Who are you?</Text>
            <Text style={styles.subtitle}>Pick the identity that best fits you right now.</Text>

            <View style={styles.options}>
              {PERSONA_OPTIONS.map((option) => (
                <WatercolorButton
                  key={option.id}
                  color={selectedRole === option.id ? 'yellow' : 'neutral'}
                  onPress={() => handleSelectRole(option.id)}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionText}>
                    {option.label}
                  </Text>
                </WatercolorButton>
              ))}
            </View>
          </ScrollView>
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
  page: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    marginBottom: SPACING.space_5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  backIcon: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1f2937',
  },
  scrollContent: {
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_3,
  },
  question: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 36,
    color: '#1f2937',
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
    lineHeight: 26,
  },
  options: {
    gap: SPACING.space_3,
    marginTop: SPACING.space_2,
    width: '100%',
  },
  optionButton: {
    width: '100%',
  },
  optionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
});
