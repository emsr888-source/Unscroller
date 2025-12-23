import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizGender'>;

export default function QuizGenderScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const progressValue = 0.1;
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, SPACING.space_2);
  const topPadding = Math.max(topInset - SPACING.space_1, SPACING.space_4);

  const handleSelect = (gender: string) => {
    setSelectedGender(gender);
    // Auto-navigate after selection
    setTimeout(() => {
      navigation.navigate('QuizReferral');
    }, 300);
  };

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <View style={styles.progressRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressValue * 100}%` }]} />
          </View>
        </View>
        <View style={styles.languageSelector}>
          <Text style={styles.flag}>🇺🇸</Text>
          <Text style={styles.languageText}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.questionNumber}>Question #1</Text>
        <Text style={styles.question}>What is your gender?</Text>

        {/* Options */}
        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              selectedGender === 'Male' && styles.optionSelected,
            ]}
            onPress={() => handleSelect('Male')}
            activeOpacity={0.9}
          >
            <View style={[
              styles.optionIndicator,
              selectedGender === 'Male' && styles.optionIndicatorSelected,
            ]}>
              {selectedGender === 'Male' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.optionText}>Male</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              selectedGender === 'Female' && styles.optionSelected,
            ]}
            onPress={() => handleSelect('Female')}
            activeOpacity={0.9}
          >
            <View style={[
              styles.optionIndicator,
              selectedGender === 'Female' && styles.optionIndicatorSelected,
            ]}>
              {selectedGender === 'Female' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.optionText}>Female</Text>
          </TouchableOpacity>
        </View>
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
  topBar: {
    paddingBottom: SPACING.space_2,
    paddingHorizontal: SPACING.space_2,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: SPACING.space_2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 28,
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
    backgroundColor: '#fbbf24',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_1,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    backgroundColor: '#fffef9',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  flag: {
    fontSize: 16,
  },
  languageText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    gap: SPACING.space_4,
  },
  questionNumber: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  question: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#475569',
    lineHeight: 28,
    marginBottom: SPACING.space_5,
  },
  options: {
    gap: SPACING.space_3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffef9',
    borderWidth: 1.2,
    borderColor: '#1f2937',
    borderRadius: 28,
    paddingVertical: SPACING.space_3,
    paddingHorizontal: SPACING.space_4,
    gap: SPACING.space_3,
  },
  optionSelected: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIndicatorSelected: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  checkmark: {
    fontFamily: 'PatrickHand-Regular',
    color: '#fffef9',
    fontSize: 18,
  },
  optionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#6b7280',
    fontSize: 16,
  },
});
