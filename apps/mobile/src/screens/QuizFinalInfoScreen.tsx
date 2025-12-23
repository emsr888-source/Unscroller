import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizFinalInfo'>;

export default function QuizFinalInfoScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const handleComplete = () => {
    // Save user info and start calculating
    navigation.navigate('Calculating');
  };

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: '90%' }]} />
        </View>

        {/* Language selector */}
        <View style={styles.languageSelector}>
          <Text style={styles.flag}>🇺🇸</Text>
          <Text style={styles.languageText}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Finally</Text>
        <Text style={styles.subtitle}>A little more about you</Text>

        {/* Form */}
        <View style={styles.form}>
          <WatercolorCard backgroundColor="#fffef9" padding={SPACING.space_4}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Sam"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </WatercolorCard>

          <WatercolorCard backgroundColor="#fffef9" padding={SPACING.space_4}>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="24"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={2}
            />
          </WatercolorCard>
        </View>
      </View>

      {/* Complete button */}
      <View style={styles.bottomContainer}>
        <WatercolorButton
          color="yellow"
          onPress={handleComplete}
          style={[(!name || !age) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Complete Quiz</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.space_4,
    paddingHorizontal: SPACING.space_5,
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
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  progressBar: {
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
  title: {
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
    marginBottom: SPACING.space_5,
  },
  form: {
    gap: SPACING.space_4,
  },
  input: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
    paddingVertical: SPACING.space_2,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
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
