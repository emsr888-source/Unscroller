import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { useOnboardingAssessment, BuildFocus } from '@/store/onboardingAssessment';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

const BUILD_OPTIONS: { id: BuildFocus; label: string }[] = [
  { id: 'business', label: 'A new business / product' },
  { id: 'brand', label: 'My personal brand' },
  { id: 'audience', label: 'Content / audience' },
  { id: 'career', label: 'Career skills' },
  { id: 'health', label: 'Health / fitness' },
  { id: 'custom', label: 'Something else' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingBuildFocus'>;

export default function OnboardingBuildFocusScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const { buildFocus, buildCustomFocus, setBuildFocus, setBuildCustomFocus } = useOnboardingAssessment();
  const [selectedFocus, setSelectedFocus] = useState<BuildFocus | null>(buildFocus);
  const [customValue, setCustomValue] = useState(buildCustomFocus);
  const progressValue = 0.75;
  const insets = useSafeAreaInsets();
  const topPadding = SPACING.space_1;

  const isCustom = selectedFocus === 'custom';
  const canContinue = useMemo(() => {
    if (!selectedFocus) return false;
    if (selectedFocus === 'custom') {
      return customValue.trim().length > 0;
    }
    return true;
  }, [selectedFocus, customValue]);

  const goToSummary = (focus: BuildFocus, customText: string) => {
    setBuildFocus(focus);
    setBuildCustomFocus(focus === 'custom' ? customText : '');
    navigation.navigate('OnboardingIdentitySummary');
  };

  const handleSelectFocus = (focus: BuildFocus) => {
    setSelectedFocus(focus);
    if (focus === 'custom') {
      return;
    }
    goToSummary(focus, '');
  };

  const handleContinue = () => {
    if (!selectedFocus || !canContinue) return;
    goToSummary(selectedFocus, customValue.trim());
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
            <Text style={styles.question}>What are you building right now?</Text>
            <Text style={styles.subtitle}>Choose the area you're focused on today.</Text>

            <View style={styles.options}>
              {BUILD_OPTIONS.map((option) => (
                <WatercolorButton
                  key={option.id}
                  color={selectedFocus === option.id ? 'yellow' : 'neutral'}
                  onPress={() => handleSelectFocus(option.id)}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionText}>
                    {option.label}
                  </Text>
                </WatercolorButton>
              ))}
            </View>

            {isCustom && (
              <WatercolorCard style={styles.customField} backgroundColor="#fffef9" padding={SPACING.space_4}>
                <Text style={styles.customLabel}>What are you building?</Text>
                <TextInput
                  value={customValue}
                  onChangeText={setCustomValue}
                  placeholder="Type your focus"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                  autoFocus
                />
              </WatercolorCard>
            )}
          </ScrollView>

          {isCustom && (
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.space_2) }]}>
              <WatercolorButton
                color="yellow"
                onPress={canContinue ? handleContinue : undefined}
                style={[!canContinue && styles.buttonDisabled]}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </WatercolorButton>
            </View>
          )}
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
  },
  optionButton: {
    width: '100%',
  },
  optionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  customField: {
    marginTop: SPACING.space_4,
    gap: SPACING.space_2,
  },
  customLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  input: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
    borderBottomWidth: 1.2,
    borderBottomColor: '#d1d5db',
    paddingVertical: SPACING.space_2,
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
