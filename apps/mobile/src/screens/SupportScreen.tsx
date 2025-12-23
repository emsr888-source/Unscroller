import React from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { ScreenWrapper } from '@/features/onboarding/components/ScreenWrapper';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { PrimaryButton } from '@/features/onboarding/components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>;

export default function SupportScreen({ navigation }: Props) {
  const handleContinue = () => {
    navigation.navigate('NotificationPermission');
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
          Whenever you need{'\n'}us, we're right here.
        </Text>

        {/* Illustration - Support tools */}
        <View style={styles.illustration}>
          {/* Envelope */}
          <View style={[styles.icon, styles.envelope]}>
            <Text style={styles.iconText}>✉️</Text>
          </View>

          {/* Checklist */}
          <View style={[styles.icon, styles.checklist]}>
            <Text style={styles.iconText}>✅</Text>
          </View>

          {/* Shield/Help */}
          <View style={[styles.icon, styles.shield]}>
            <Text style={styles.iconText}>🚀</Text>
          </View>

          {/* Question mark */}
          <View style={[styles.icon, styles.question]}>
            <Text style={styles.iconText}>❓</Text>
          </View>

          {/* Message bubble */}
          <View style={[styles.icon, styles.message]}>
            <Text style={styles.iconText}>💬</Text>
          </View>

          {/* Pink blob */}
          <View style={[styles.icon, styles.blob]}>
            <Text style={styles.iconText}>💗</Text>
          </View>

          {/* Grid pattern */}
          <View style={styles.gridPattern} />
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <PrimaryButton title="Let's go" onPress={handleContinue} />
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
    marginBottom: SPACING.space_5,
  },
  illustration: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 48,
  },
  envelope: {
    top: '10%',
    left: '10%',
  },
  checklist: {
    bottom: '35%',
    left: '5%',
    fontSize: 40,
  },
  shield: {
    top: '15%',
    right: '15%',
  },
  question: {
    top: '40%',
    right: '10%',
  },
  message: {
    bottom: '15%',
    right: '20%',
  },
  blob: {
    bottom: '25%',
    right: '5%',
  },
  gridPattern: {
    position: 'absolute',
    bottom: '20%',
    left: '15%',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    transform: [{ rotate: '45deg' }],
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_6,
  },
});
