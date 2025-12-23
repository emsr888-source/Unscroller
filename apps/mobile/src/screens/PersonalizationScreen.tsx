import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Personalization'>;

export default function PersonalizationScreen({ navigation }: Props) {
  const { firstName: storedFirstName, setFirstName: setAssessmentFirstName } = useOnboardingAssessment();
  const [firstName, setFirstName] = useState(storedFirstName ?? '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [attempted, setAttempted] = useState(false);
  const region = 'North America';

  const trimmedName = firstName.trim();
  const parsedAge = parseInt(age, 10);
  const isAgeNumber = !Number.isNaN(parsedAge) && parsedAge > 0;
  const isFormValid = trimmedName.length > 0 && isAgeNumber;

  useEffect(() => {
    setFirstName(storedFirstName ?? '');
  }, [storedFirstName]);

  const stars = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        x: Math.random(),
        y: Math.random(),
        opacity: Math.random() * 0.4 + 0.2,
        size: Math.random() * 2 + 2,
      })),
    []
  );
  const { width, height } = Dimensions.get('window');

  const handleNext = () => {
    if (!isFormValid) {
      setAttempted(true);
      return;
    }
    setAssessmentFirstName(trimmedName);
    navigation.navigate('Congratulations');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />

      <View style={styles.starsContainer}>
        {stars.map(star => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x * width,
                top: star.y * height,
                opacity: star.opacity,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Is this correct?</Text>
          <Text style={styles.subtitle}>We&apos;re personalizing your experience on Unscroller.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.INACTIVE_GREY}
              />
              <Text style={styles.arrow}>›</Text>
            </View>
            {attempted && trimmedName.length === 0 && (
              <Text style={styles.errorText}>First name is required.</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Age</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="24"
                keyboardType="number-pad"
                placeholderTextColor={COLORS.INACTIVE_GREY}
              />
              <Text style={styles.arrow}>›</Text>
            </View>
            {attempted && !isAgeNumber && <Text style={styles.errorText}>Enter a valid age.</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderOptions}>
              {(['Male', 'Female'] as const).map(option => {
                const isSelected = gender === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.genderOption, isSelected && styles.genderOptionSelected]}
                    onPress={() => setGender(option)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.genderOptionText, isSelected && styles.genderOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.inputRow}>
              <View>
                <Text style={styles.label}>Region</Text>
                <Text style={styles.value}>{region}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="Next →" onPress={handleNext} disabled={!isFormValid} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: COLORS.ACCENT_GRADIENT_START,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_6,
    paddingBottom: SPACING.space_7,
  },
  header: {
    marginBottom: SPACING.space_5,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_2,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_SECONDARY,
  },
  card: {
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 16,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GLASS_BORDER,
    paddingVertical: SPACING.space_3,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.space_1,
  },
  input: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    paddingRight: SPACING.space_2,
  },
  value: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'Inter-SemiBold',
  },
  arrow: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 22,
  },
  errorText: {
    marginTop: SPACING.space_1,
    color: '#D14343',
    fontSize: 13,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  genderOption: {
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
  },
  genderOptionSelected: {
    borderColor: COLORS.ACCENT_GRADIENT_START,
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
  },
  genderOptionText: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'Inter-SemiBold',
  },
  genderOptionTextSelected: {
    color: COLORS.ACCENT_GRADIENT_START,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    borderTopWidth: 1,
    borderTopColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
});
