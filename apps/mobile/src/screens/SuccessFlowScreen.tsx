import React from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'SuccessFlow'>;

export default function SuccessFlowScreen({ navigation }: Props) {
  const handleContinue = () => {
    navigation.navigate('Support');
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <Pressable style={styles.container} onPress={handleContinue}>
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>UNSCROLLER</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          Sometimes things{'\n'}flow easily...
        </Text>

        {/* Illustration - "SUCCESS" letters with hands */}
        <View style={styles.illustration}>
          <View style={styles.letterRow}>
            <View style={[styles.hand, styles.handLeft]}>
              <Text style={styles.handEmoji}>👋</Text>
            </View>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>S</Text>
            </View>
          </View>

          <View style={styles.letterRow}>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>U</Text>
            </View>
            <View style={[styles.hand, styles.handRight]}>
              <Text style={styles.handEmoji}>✋</Text>
            </View>
          </View>

          <View style={styles.letterRow}>
            <View style={[styles.hand, styles.handLeft]}>
              <Text style={styles.handEmoji}>🤚</Text>
            </View>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>C</Text>
            </View>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>C</Text>
            </View>
          </View>

          <View style={styles.letterRow}>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>E</Text>
            </View>
            <View style={[styles.hand, styles.handRight]}>
              <Text style={styles.handEmoji}>👐</Text>
            </View>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>S</Text>
            </View>
          </View>

          <View style={styles.letterRow}>
            <View style={[styles.hand, styles.handLeft]}>
              <Text style={styles.handEmoji}>🖐️</Text>
            </View>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>S</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.continueButton}>
          <Text style={styles.continueText}>TAP ANYWHERE TO CONTINUE</Text>
        </View>
      </View>
      </Pressable>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    paddingTop: SPACING.space_6,
    alignItems: 'center',
  },
  logo: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_6,
    paddingTop: SPACING.space_6,
    alignItems: 'center',
    gap: SPACING.space_5,
  },
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 42,
  },
  illustration: {
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  letterRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  letterBox: {
    width: 54,
    height: 54,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  letter: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  hand: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handLeft: {
    transform: [{ rotate: '-15deg' }],
  },
  handRight: {
    transform: [{ rotate: '15deg' }],
  },
  handEmoji: {
    fontSize: 36,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
  },
  continueButton: {
    alignItems: 'center',
    paddingVertical: SPACING.space_3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  continueText: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 1,
  },
});
