import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import FocusAwareStatusBar from '@/components/FocusAwareStatusBar';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

const NAME_PROGRESS = 0.2;
const ERROR_COLOR = '#ef4444';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingName'>;

export default function OnboardingNameScreen({ navigation }: Props) {
  const { firstName, setFirstName } = useOnboardingAssessment();
  const [name, setName] = useState(firstName ?? '');
  const [attempted, setAttempted] = useState(false);
  const insets = useSafeAreaInsets();
  const topPadding = SPACING.space_1;

  const trimmedName = useMemo(() => name.trim(), [name]);
  const canContinue = trimmedName.length > 0;

  // Force status bar to dark-content when screen focuses
  useStatusBarStyle('dark-content');

  const handleContinue = () => {
    if (!canContinue) {
      setAttempted(true);
      return;
    }
    setFirstName(trimmedName);
    navigation.navigate('OnboardingProfileCard');
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.page, { paddingTop: topPadding }]}
        >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${NAME_PROGRESS * 100}%` }]} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.eyebrow}>Let's personalize this</Text>
            <Text style={styles.title}>What should we call you?</Text>
            <View style={{ height: SPACING.space_4 }} />

            <WatercolorCard 
              style={[styles.inputCard, attempted && !canContinue && styles.inputCardError]}
              backgroundColor="#fffef9"
              padding={SPACING.space_4}
            >
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="First name"
                placeholderTextColor="#9ca3af"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              {attempted && !canContinue && (
                <Text style={styles.errorText}>Please enter at least one character.</Text>
              )}
            </WatercolorCard>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.space_2) }]}>
            <WatercolorButton
              color="yellow"
              onPress={canContinue ? handleContinue : undefined}
              style={[!canContinue && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </WatercolorButton>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#fdfbf7',
  },
  page: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
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
  content: {
    flex: 1,
    gap: SPACING.space_3,
    paddingTop: SPACING.space_2,
  },
  eyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 36,
    color: '#1f2937',
    lineHeight: 44,
  },
  inputCard: {
    marginTop: SPACING.space_2,
  },
  inputCardError: {
    borderColor: ERROR_COLOR,
    borderWidth: 2,
  },
  input: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  errorText: {
    marginTop: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: ERROR_COLOR,
  },
  bottomBar: {
    paddingTop: SPACING.space_4,
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
