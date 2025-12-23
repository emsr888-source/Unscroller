import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralCode'>;

export default function ReferralCodeScreen({ navigation }: Props) {
  const [referralCode, setReferralCode] = useState('');
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    // Save referral code if provided
    navigation.navigate('RatingRequest');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
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
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Do you have a{'\n'}referral code?</Text>
        <Text style={styles.subtitle}>You can skip this step.</Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Referral Code"
            placeholderTextColor="#9ca3af"
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Continue Button */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom, SPACING.space_2) },
        ]}
      >
        <WatercolorButton color="yellow" onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
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
    paddingBottom: SPACING.space_4,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#fffef9',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  backButtonText: {
    color: '#1f2937',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_5,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    marginBottom: SPACING.space_2,
  },
  subtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginBottom: SPACING.space_6,
  },
  inputContainer: {
    marginBottom: SPACING.space_4,
  },
  input: {
    backgroundColor: '#fffef9',
    borderWidth: 1.2,
    borderColor: '#1f2937',
    borderRadius: 16,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
    color: '#1f2937',
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_4,
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
