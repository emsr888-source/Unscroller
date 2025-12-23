import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizReferral'>;

const SOURCES = [
  { id: 'google', icon: '🔍', label: 'Google' },
  { id: 'tv', icon: '📺', label: 'TV' },
  { id: 'x', icon: '✖️', label: 'X' },
  { id: 'instagram', icon: '📷', label: 'Instagram' },
  { id: 'tiktok', icon: '🎵', label: 'TikTok' },
  { id: 'facebook', icon: '👍', label: 'Facebook' },
];

export default function QuizReferralScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const progressValue = 0.6;
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, SPACING.space_2);
  const topPadding = Math.max(topInset - SPACING.space_1, SPACING.space_4);

  const handleSelect = (source: string) => {
    setSelectedSource(source);
    // Auto-navigate after selection
    setTimeout(() => {
      navigation.navigate('Calculating');
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.questionNumber}>Question #3</Text>
        <Text style={styles.question}>Where did you hear about us?</Text>

        {/* Options */}
        <View style={styles.options}>
          {SOURCES.map(source => (
            <TouchableOpacity
              key={source.id}
              style={[
                styles.option,
                selectedSource === source.id && styles.optionSelected,
              ]}
              onPress={() => handleSelect(source.id)}
              activeOpacity={0.9}
            >
              <Text style={styles.optionIcon}>{source.icon}</Text>
              <Text style={styles.optionText}>{source.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
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
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#1f2937',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    paddingBottom: SPACING.space_6,
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
  optionIcon: {
    fontSize: 24,
    width: 32,
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
